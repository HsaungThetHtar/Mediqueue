const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("MediQueue Admin Backend Running");
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});