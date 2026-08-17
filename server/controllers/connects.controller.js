import { Brand } from "../models/Brand.js";
import { ConnectPurchase } from "../models/ConnectPurchase.js";
import { ConnectUsage } from "../models/ConnectUsage.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// INR pricing — connect packages a brand can buy to unlock applicant contact
// details. Kept server-side so the client can never tamper with price.
export const CONNECT_PACKAGES = [
  { key: "starter", connects: 10, priceInr: 399 },
  { key: "growth", connects: 25, priceInr: 899 },
  { key: "pro", connects: 50, priceInr: 1499 },
  { key: "best-value", connects: 100, priceInr: 2499, bestValue: true },
];

function findBrand(userId) {
  return Brand.findOne({ userId }).select("_id connectBalance");
}

function purchaseToClientShape(doc) {
  return {
    id: doc._id.toString(),
    date: doc.createdAt,
    description: `${doc.connects} Connects Package`,
    connects: doc.connects,
    amountInr: doc.amountInr,
    status: doc.status,
  };
}

// GET /api/connects/packages
export const listPackages = asyncHandler(async (req, res) => {
  const brand = await findBrand(req.user._id);
  if (!brand) return res.status(404).json({ error: "Your brand profile is still being set up. Try again in a moment." });
  res.json({ packages: CONNECT_PACKAGES, connectBalance: brand.connectBalance });
});

// POST /api/connects/purchase  { packageKey }
export const purchaseConnects = asyncHandler(async (req, res) => {
  const brand = await findBrand(req.user._id);
  if (!brand) return res.status(404).json({ error: "Your brand profile is still being set up. Try again in a moment." });

  const pkg = CONNECT_PACKAGES.find((p) => p.key === req.body.packageKey);
  if (!pkg) return res.status(400).json({ error: "Unknown connects package" });

  const purchase = await ConnectPurchase.create({
    brandId: brand._id,
    packageKey: pkg.key,
    connects: pkg.connects,
    amountInr: pkg.priceInr,
  });

  brand.connectBalance = (brand.connectBalance || 0) + pkg.connects;
  await brand.save();

  // Send Purchase Receipt Email
  import("../models/User.js").then(({ User }) => {
    User.findById(req.user._id).select("email notificationPreferences").then(user => {
      // Check if user has disabled email notifications for purchases (assuming we store this in preferences)
      if (user && user.email && user.notificationPreferences?.email !== false) {
        import("../utils/email.js")
          .then(({ sendPurchaseReceiptEmail }) => {
            sendPurchaseReceiptEmail(user.email, pkg.key.toUpperCase(), pkg.connects, pkg.priceInr)
              .catch(console.error);
          })
          .catch(console.error);
      }
    }).catch(console.error);
  });

  res.status(201).json({ purchase: purchaseToClientShape(purchase), connectBalance: brand.connectBalance });
});

// GET /api/connects/purchases — used by both Connect Purchase History and
// Package Purchase History (same underlying transactions today).
export const listPurchases = asyncHandler(async (req, res) => {
  const brand = await findBrand(req.user._id);
  if (!brand) return res.json([]);
  const purchases = await ConnectPurchase.find({ brandId: brand._id }).sort({ createdAt: -1 });
  res.json(purchases.map(purchaseToClientShape));
});

// GET /api/connects/wallet — ledger view: every purchase credits connects,
// every unlock debits connects, running balance shown alongside each entry.
export const listWallet = asyncHandler(async (req, res) => {
  const brand = await findBrand(req.user._id);
  if (!brand) return res.json([]);
  
  const purchases = await ConnectPurchase.find({ brandId: brand._id });
  const usages = await ConnectUsage.find({ brandId: brand._id });

  const transactions = [
    ...purchases.map(p => ({
      date: p.createdAt,
      description: `${p.connects} Connects Added`,
      debited: null,
      credited: p.connects,
      type: "credit",
      id: p._id.toString()
    })),
    ...usages.map(u => ({
      date: u.createdAt,
      description: `Unlocked Contact Details`,
      debited: u.connects,
      credited: null,
      type: "debit",
      id: u._id.toString()
    }))
  ];

  transactions.sort((a, b) => a.date - b.date);

  let running = 0;
  const ledger = transactions.map((t) => {
    if (t.type === "credit") running += t.credited;
    else running -= t.debited;
    
    return {
      id: t.id,
      date: t.date,
      description: t.description,
      debited: t.debited,
      credited: t.credited,
      closingBalance: running,
    };
  });

  res.json(ledger.reverse());
});
