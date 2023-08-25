import express, { application } from "express";
import session from "express-session";
import path from "path";
import morgan from "morgan";
import Logger from "./helpers/logger";
import { sync } from "./sequelize";
import router from "./routes";
import dotenv from "dotenv";
import initDB from "./init";
dotenv.config();
const PORT = process.env.PORT;
const DASHBOARD = process.env.DASHBOARD;
const pathRoot = process.cwd();
const app = express();
app.set("views", path.join(pathRoot, "./views"));
app.set("view engine", "ejs");
app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: process.env.SECRET,
    cookie: {
        maxAge: 30*24*60*60*1000
    }
}));
app.use(express.json({
    limit: "50mb"
}));
app.use(express.urlencoded({
    limit: "50mb",
    extended: true
}));
if(process.env.NODE_ENV === "development") {
    app.use("/assets", express.static(path.join(pathRoot, "./public")));
    app.use(morgan("dev"));
} else {
    app.use("/assets", express.static(path.join(pathRoot, "./public"), {
        maxAge: 30*24*60*60*1000
    }));
}
app.disable("x-powered-by");
app.use("/", router);
//
app.locals.DASHBOARD = DASHBOARD;
sync().then(async() => {
    await initDB();
    const server = app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
}).catch((err) => {
    Logger.error(err);
})