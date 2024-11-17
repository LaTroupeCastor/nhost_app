import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

 export default async (req: Request, res: Response) => {
   try {
       console.log(process.env.MY_NHOST_CONFIG);
     // Vérification des champs requis
     const requiredFields = ['lastname', 'firstname', 'email', 'message'];
     const missingFields = requiredFields.filter(field => !req.body[field]);

     if (missingFields.length > 0) {
       return res.status(400).json({
         error: 'Champs requis manquants',
         missingFields
       });
     }

     // Configuration conditionnelle selon l'environnement
     const transporter = nodemailer.createTransport(
       process.env.NODE_ENV === 'development'
         ? {
             // Config Mailhog pour dev
             host: 'mailhog',
             port: 1025,
             secure: false,
             ignoreTLS: true
           }
         : {
             // Config production
             host: process.env.SMTP_HOST,
             port: Number(process.env.SMTP_PORT),
             secure: true,
             auth: {
               user: process.env.SMTP_USER,
               pass: process.env.SMTP_PASS,
             }
           }
     );

       // Configuration du mail
       const mailOptions = {
           from: process.env.SMTP_USER, // Adresse expéditeur
           to: process.env.CONTACT_EMAIL, // Adresse qui recevra les contacts
           subject: 'Nouveau message depuis le formulaire de contact',
           html: `
         <h2>Nouveau message de contact</h2>
         <p><strong>Nom:</strong> ${req.body.lastname}</p>
         <p><strong>Prénom:</strong> ${req.body.firstname}</p>
         <p><strong>Email:</strong> ${req.body.email}</p>
         <p><strong>Téléphone:</strong> ${req.body.phone}</p>
         <h3>Message:</h3>
         <p>${req.body.message}</p>
       `
       };

       // Envoi de l'email
       const info = await transporter.sendMail(mailOptions);

       res.status(200).json({
           message: 'Email envoyé avec succès',
           messageId: info.messageId,
           previewUrl: process.env.NODE_ENV === 'development'
               ? 'http://localhost:8025'
               : undefined
       });

   } catch (error) {
     console.error('Erreur lors de l\'envoi de l\'email:', error);
     res.status(500).json({
       error: 'Erreur lors de l\'envoi de l\'email',
       details: error.message
     });
   }
 };
