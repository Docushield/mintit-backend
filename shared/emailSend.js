var nodemailer = require('nodemailer');
var authConfig=require('./authConfig.js');
function SendReportOnEmail(toEmail,body,subject,attachments) {
  console.log("In send email");
  var transporter = nodemailer.createTransport({
    //service: authConfig.service,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: authConfig.senderEmail,
      pass: authConfig.password
    }
  });
  var mailOptions = {
    from: authConfig.senderEmail,
    to: toEmail,
    subject: subject,
    text:body,
    attachments: attachments
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
module.exports={SendReportOnEmail};

