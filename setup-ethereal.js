const nodemailer = require('nodemailer');
const fs = require('fs');

(async () => {
    const account = await nodemailer.createTestAccount();
    let env = fs.readFileSync('.env', 'utf8');

    const setValue = (key, value) => {
        const re = new RegExp('^' + key + '=.*$', 'm');
        env = re.test(env)
            ? env.replace(re, key + '=' + value)
            : env + '\n' + key + '=' + value;
    };

    setValue('SMTP_HOST', account.smtp.host);
    setValue('SMTP_PORT', String(account.smtp.port));
    setValue('SMTP_USER', account.user);
    setValue('SMTP_PASS', account.pass);

    fs.writeFileSync('.env', env);
    console.log('Updated .env with new Ethereal user:', account.user);
})();