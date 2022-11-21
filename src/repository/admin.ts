import { connect } from "../db";
import { APILogger } from "../logger/api";
import { Admin } from "../models/admin";
import { v4 as uuidv4 } from "uuid";
import { Response } from "express";

export class AdminRepository {
  private logger: APILogger;
  private db: any = {};
  private adminRepository: any;

  constructor() {
    this.db = connect();
    this.adminRepository = this.db.sequelize.getRepository(Admin);
    this.logger = new APILogger();
  }

  async validateAdmin(user: string, pass: string, res: Response) {
    let data = {};
    try {
      data = await this.adminRepository.findOne({
        where: {
          username: user,
          password: pass
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    if (Object.keys(data || {}).length == 0) {
      res.status(400).send({ error: "invalid username or password" });
      return null;
    } else {
      res.status(200).send({ token:data["token"]});
      return true;
    };
  }

  async updateStatus(m_status: string,c_status: string, token:string, res: Response) {
    try {
      let data = await this.adminRepository.findOne({
        where: {
          id: 1,
        },
      });
      if (!data) { 
        res.status(400).json({ error: "No data found." });
        return;
      }else if(data['token'] != token || !token){
        res.status(400).json({ error: "invalid token provided" });
        return;
      }
      let status = await this.adminRepository.update(
        { minting: m_status, collection: c_status },
        {
          where: {
            id: 1,
          },
          returning: true,
        }
      );
      if (!status) {
        res.status(400).json({ error: "not updated." });
        return;
      }
      res.status(200).json({ message:"updated" });
      return status;
    } catch (err) {
      this.logger.error(
        "error occurred while updating status: " + JSON.stringify(err.errors)
      );
    }
  }

  async getStatus() {
    let data = {};
    try {
      data = await this.adminRepository.findOne({
        where: {
          id: 1,
        },
      });
    } catch (err) {
      this.logger.error("Error::" + err);
    }
    return data;
  }
}

