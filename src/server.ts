import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, () => {
  console.log(`Server listening at ${env.APP_BASE_URL}`);
});
