import nodemailer from "nodemailer";

async function main() {
  let testAccount = await nodemailer.createTestAccount();
  console.log("SMTP_HOST=smtp.ethereal.email");
  console.log("SMTP_PORT=587");
  console.log(`SMTP_USER=${testAccount.user}`);
  console.log(`SMTP_PASS=${testAccount.pass}`);
  console.log("SMTP_SECURE=false");
  console.log("SMTP_FROM=\"InfluBrand Testing\" <test@influbrand.com>");
}

main().catch(console.error);
