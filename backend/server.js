// server.js
const express = require("express");
const multer = require("multer");
const { fork } = require("child_process");
const path = require("path");
const fs = require("fs").promises;
const fs2 = require("fs");
const { transliterate, slugify } = require("transliteration");
const terminate = require("terminate");
const app = express();
const upload = multer({ dest: "uploads/" });
const cors = require("cors");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const streamProcesses = {}; // For storing stream processes

function turkishToLatin(input) {
  const turkishChars = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
    Ç: "C",
    Ğ: "G",
    İ: "I",
    Ö: "O",
    Ş: "S",
    Ü: "U",
  };

  return input.replace(/ç|ğ|ı|ö|ş|ü|Ç|Ğ|İ|Ö|Ş|Ü/g, function (match) {
    return turkishChars[match];
  });
}

function formatString(input) {
  const extension = input.split(".").pop();
  const fileName = input.substring(0, input.lastIndexOf("."));

  const latinString = turkishToLatin(fileName);
  const formattedName = latinString
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_");

  return "video_" + formattedName + "." + extension;
}
app.post("/upload", upload.single("file"), (req, res) => {
  const originalName = req.file.originalname;
  console.log(originalName);
  const sanitizedFileName = formatString(originalName);
  const filePath = path.join(__dirname, "uploads", sanitizedFileName);

  fs2.renameSync(req.file.path, filePath);
  const streamName = sanitizedFileName.replace(".mp4", "");
  const rtspUrl = `rtsp://localhost:8554/${streamName}`;
  const hlsUrl = `http://localhost:8888/${streamName}/index.m3u8`;
  const hls2Url = `http://localhost:3000/videos/${streamName}.m3u8`;
  res.json({ fileName: sanitizedFileName, rtspUrl, hlsUrl, hls2Url });
});

app.post("/start", async (req, res) => {
  console.log("Starting stream");
  const { fileName } = await req.body;
  if (streamProcesses[fileName]) {
    return res.status(400).json({ error: "Stream already running" });
  }
  console.log("File name:", fileName);
  const streamer = fork("./streamer.js", [fileName]);
  streamProcesses[fileName] = streamer;
  console.log(streamProcesses);
  res.sendStatus(200);
});

app.post("/stop", async (req, res) => {
  // Stopping the stream by using the process id
  const { fileName } = req.body;
  try {
    console.log(streamProcesses[fileName].pid);
    terminate(streamProcesses[fileName].pid);
    delete streamProcesses[fileName];
    res.sendStatus(200);
  } catch (error) {
    console.error("Error stopping stream:", error);
    res.status(500).json({ error: "Failed to stop stream" });
  }
});

app.get("/getVideoNames", async (req, res) => {
  // Serves video names and their streaming URls
  try {
    const directoryPath = path.join(__dirname, "./uploads");
    const files = await fs.readdir(directoryPath);

    let videoFiles = files.filter((file) => file.endsWith(".mp4"));
    videoFiles = videoFiles.map((file) => file.replace(".mp4", ""));
    console.log(videoFiles);

    console.log("Video files:", videoFiles);
    const videoDetails = videoFiles.map((file) => ({
      name: file + ".mp4",
      rtspUrl: `rtsp://localhost:8554/${file}`,
      hlsUrl: `http://localhost:8888/${file}/index.m3u8`,
      hls2Url: `http://localhost:3000/videos/${file}.m3u8`,
    }));

    res.json([...videoDetails]);
  } catch (error) {
    console.error("Error reading video files:", error);
    res.status(500).json({ error: "Failed to retrieve video files" });
  }
});

///////////////////////////////////////
app.get("/videos/:id", (req, res) => {
  // One API endpoint for both m3u8 and ts files
  const id = req.params.id;
  const f_path = path.join(__dirname, "uploads", id);
  const f_ext = path.extname(f_path);

  fs2.access(f_path, fs2.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${f_path}`);
      return res.status(404).send("File not found");
    }

    switch (f_ext) {
      case ".m3u8": // If file extension is m3u8 serve m3u8 file
        console.log("Streaming m3u8: ", f_path);
        res.status(200).set("Content-Type", "application/vnd.apple.mpegurl");
        const m3u8Stream = fs2.createReadStream(f_path);
        m3u8Stream.on("error", (streamErr) => {
          console.error(`Error streaming m3u8 file: ${streamErr.message}`);
          res.status(500).send("Error streaming m3u8 file");
        });
        m3u8Stream.pipe(res);
        break;

      case ".ts": // if file extension is ts serve ts file
        console.log("Streaming ts: ", f_path);
        res.status(200).set("Content-Type", "video/MP2T");
        const tsStream = fs2.createReadStream(f_path);
        tsStream.on("error", (streamErr) => {
          console.error(`Error streaming ts file: ${streamErr.message}`);
          res.status(500).send("Error streaming ts file");
        });
        tsStream.pipe(res);
        break;

      default:
        res.status(404).send(`Unexpected file type ${f_ext}`);
    }
  });
});
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
