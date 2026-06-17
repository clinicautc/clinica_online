//tesMail.js archivo para prubar nodemailer

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'clinicautc1@gmail.com',
        pass: 'iwcj dedk imtn nkri'
    }
});

async function enviarCorreo() {

    try {

        const info = await transporter.sendMail({
            from: '"Prueba UTC" <clinicautc1@gmail.com>',
            to: 'e.resendiz.r688@edu.utc.mx',
            subject: 'Prueba NodeMailer',
            text: 'Hola, este es un correo de prueba enviado con NodeMailer.'
        });

        console.log("Correo enviado");
        console.log(info);

    } catch (error) {

        console.error("Error:");
        console.error(error);

    }


}

enviarCorreo();