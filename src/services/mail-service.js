const nodemailer = require('nodemailer');

class MailService {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.transporter = null;
  }

  getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const mailConfig = this.config.app.mail;

    this.transporter = nodemailer.createTransport({
      host: mailConfig.transport.host,
      port: mailConfig.transport.port,
      secure: Boolean(mailConfig.transport.secure),
      auth: {
        user: mailConfig.transport.auth.user,
        pass: mailConfig.transport.auth.pass
      }
    });

    return this.transporter;
  }

  async sendWelcomeEmail(user) {
    const mailConfig = this.config.app.mail;

    if (!mailConfig.enabled || !mailConfig.sendWelcomeEmail) {
      return;
    }

    const transporter = this.getTransporter();
    const text = mailConfig.welcome.text.replace('{{username}}', user.username);

    await transporter.sendMail({
      from: mailConfig.from,
      to: user.email,
      subject: mailConfig.welcome.subject,
      text
    });

    this.logger.info(`Welcome email sent to ${user.email}`);
  }
}

module.exports = {
  MailService
};

