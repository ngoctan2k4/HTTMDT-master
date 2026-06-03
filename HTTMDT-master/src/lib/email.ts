import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error("Chưa cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS và SMTP_FROM để gửi email OTP.");
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: port === 465,
  };
}

export async function sendMail({ to, subject, html, text }: MailOptions) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    text,
  });
}

export function buildRegisterOtpEmail(otp: string) {
  return {
    subject: "Mã OTP xác thực đăng ký An Cư Plus",
    text: `Mã OTP đăng ký An Cư Plus của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">Xác thực đăng ký An Cư Plus</h2>
        <p>Mã OTP của bạn là:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#f97316">${otp}</div>
        <p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
      </div>
    `,
  };
}
