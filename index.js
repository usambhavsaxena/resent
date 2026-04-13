import express from "express";
import cors from "cors";
import webhookRouter from "./webhook.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["POST"],
}));

app.use(express.json());
app.use("/api", webhookRouter);
app.get("/", (req, res) => {
    res.send("We are live!");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
