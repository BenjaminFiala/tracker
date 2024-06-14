import express from "express";
import cors from "cors";
import config from "config";
import { userRouter } from "./routes/user-routes";
import * as fs from "node:fs";
import https from "https";

const app = express();
const port: number = config.get<number>("appConfig.port");
const origin: string = config.get<string>("appConfig.origin");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/users", userRouter);

function errorHandler(err: any, req: any, res: any, next: any) {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500).send("Something broke!  " + err);
}
app.use(errorHandler);

const server = https.createServer(
  {
    key: fs.readFileSync("../localhost+3-key.pem"),
    cert: fs.readFileSync("../localhost+3.pem"),
  },
  app
);

app.use(
  express.static("../tracker-client-v01/dist/bookshop-client-v01/browser")
);

server.listen(port, "127.0.0.1", () => {
  console.log(`Example app listening on port ${port}`);
});
