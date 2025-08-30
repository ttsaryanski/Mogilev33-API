import app from "./app.js";
import mongooseInit from "./config/mongooseInit.js";

const PORT = 3000;
const port = process.env.PORT || PORT;

mongooseInit().then(() => {
    app.listen(port, () =>
        console.log(`Server running on http://localhost:${port}`)
    );
});
