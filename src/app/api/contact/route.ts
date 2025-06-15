import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // メール送信の設定
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // メールの内容
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "nakahina2014@gmail.com",
      subject: `[HIPHOP ROOTS] お問い合わせ from ${name}`,
      text: `
名前: ${name}
メールアドレス: ${email}

メッセージ:
${message}
      `,
      html: `
<h2>HIPHOP ROOTS お問い合わせ</h2>
<p><strong>名前:</strong> ${name}</p>
<p><strong>メールアドレス:</strong> ${email}</p>
<p><strong>メッセージ:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>
      `,
    };

    // メール送信
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: "メールが送信されました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "メールの送信に失敗しました" },
      { status: 500 }
    );
  }
}
