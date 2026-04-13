import express from "express";
import cors from "cors";
import webhookRouter from "./webhook.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173", "https://neev.unchainedin.app", "https://unchainedin.app"],
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
