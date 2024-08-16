// streamer.js
const path = require("path");
const { exec } = require("child_process");
const fileName = process.argv[2];
const streamName = fileName.replace(".mp4", "");
console.log(`Starting stream for file: ${fileName}`);

const rtspCommand = `ffmpeg -re -stream_loop -1 -i uploads/${fileName} -c copy -f rtsp -rtsp_transport tcp rtsp://mediamtx:8554/${streamName}`;
const hlsOutputPath = path.join("uploads", fileName.replace(".mp4", ""));
const hlsCommand = `ffmpeg -re -i uploads/${fileName} -c:v copy -c:a copy -f hls -hls_time 10 -hls_list_size 0 -hls_flags delete_segments ${hlsOutputPath}.m3u8`;

const rtspProcess = exec(rtspCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});

const hslProcess = exec(hlsCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});
