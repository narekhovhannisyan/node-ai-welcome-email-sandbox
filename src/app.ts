import express from "express";

import { signupRouter } from "./routes/signup";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    ok: true,
  });
});

app.use("/signup", signupRouter);

app.get("/", (_request, response) => {
  response.redirect("/signup");
});
