import * as AWS from "aws-sdk";
import fs from "fs";
import { File } from "../types";

const bucketName = process.env.BUCKET_NAME || "mintit-files";

export const uploadFile = async (file: File) => {
  const client = new AWS.S3();
  const uploadParams = {
    Bucket: bucketName,
    Key: file.key,
    ContentType: file.type,
    Body: file.content,
    ACL: "public-read",
  };
  try {
    const data = await client.upload(uploadParams).promise();
    console.log(data);
    console.log("Upload Success for: ", data.Key);
    return data.Key;
  } catch (err) {
    console.log(
      "Error occurred while uploading file: ",
      file.key,
      " error: ",
      err
    );
    return "NO_URL";
  }
};

export const getFile = async (key: string) => {
  const client = new AWS.S3();
  client.getObject(
    { Bucket: bucketName, Key: "test.json" },
    function (err, data) {
      if (err) {
        console.log("Error: ", err);
        return;
      }

      if (data && data.Body) {
        console.log(data.Body.toString());
        return data.Body;
      }
    }
  );
};

export const uploadFileByPath = async (multerFile: Express.Multer.File) => {
  const client = new AWS.S3();
  const content = fs.readFileSync(multerFile.path).toString();
  return uploadFile({
    key: multerFile.originalname,
    content: content,
    type: multerFile.mimetype,
  });
};
