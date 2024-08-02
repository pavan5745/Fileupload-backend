const express = require("express");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Configuration
cloudinary.config({
  cloud_name: "dpwqr2t3o",
  api_key: "179572399832148",
  api_secret: "07CnxoAg6R4pMi4WWhlGpAGpklI", // Click 'View Credentials' below to copy your API secret
});

// MongoDB setup
let DB =
  "mongodb+srv://pavanyadav5745:47acqIP0kc1xF5ML@video.a4xpidj.mongodb.net/";
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnailUrl: String,
  videoUrl: String,
});

const Item = mongoose.model("Item", itemSchema);

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

app.post(
  "/upload",
  upload.fields([{ name: "thumbnail" }, { name: "video" }]),
  async (req, res) => {
    try {
      console.log("Request Body:", req.body);
      console.log("Request Files:", req.files);

      if (!req.body || !req.files || !req.files.thumbnail || !req.files.video) {
        return res.status(400).send({ error: "No files or data received" });
      }
      console.log(req.body);
      const { title, description } = req.body;
      const thumbnail = req.files.thumbnail[0];
      const video = req.files.video[0];

      const thumbnailResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) {
              console.log(error);
              return reject(error);
            }
            resolve(result);
          }
        );
        uploadStream.end(thumbnail.buffer);
      });

      const videoResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "video" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(video.buffer);
      });
      /*console.log(req.files);
      const thumbnailResult = await cloudinary.uploader
        .upload_stream({ resource_type: "image" })
        .end(req.files.thumbnail[0].buffer);
      const videoResult = await cloudinary.uploader
        .upload_stream({ resource_type: "video" })
        .end(req.files.video[0].buffer);*/

      const newItem = new Item({
        title,
        description,
        thumbnailUrl: thumbnailResult.secure_url,
        videoUrl: videoResult.secure_url,
      });

      await newItem.save();
      res.status(201).send(newItem);
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

app.get("/items", async (req, res) => {
  const items = await Item.find();
  console.log(items);
  res.send(items);
});
app.get("/items/:id", async (req, res) => {
  console.log(req.params);
  const items = await Item.findById(req.params.id);
  console.log(items);
  res.send(items);
});
app.delete("/items/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted succefuly" });
  } catch (err) {
    res.json({ message: err });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
