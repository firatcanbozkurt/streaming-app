# streaming-app

## Tech Stack

**Frontend:** Angular used for the frontend


**Backend:** Express.js used for server purposes

**Docker:** The app is dockerized for easy to install and use

**FFmpeg:** It is used for transcoding videos

**Mediamtx:** It is used for streaming both RTSP and HLS streams


## App Architecture

### Frontend
The app uses the frontend for all interactions with the backend. Users can upload a .mp4 video to the server and see the streaming addresses for RTSP, HSL, and HSL 2(Express) on the UI. There are two buttons "Başlat" for startıng the stream and "Durdur" for stopping the stream.

### Backend (Express)
The server accepts file uploads and renames them appropriately. For streaming purposes, Express creates a child process to efficiently manage processes by creating a separate process.
FFmpeg is used for transcoding the video and it creates an .m3u8 file that consists of the name of the video chunks with the extension of .ts.

The server also serves the HLS stream using an endpoint called `/videos/:id`. ID is the name of the video being streamed.
This endpoint accepts both .m3u8 and .ts requests. There is a switch that detects the extension of the file and starts streaming the right file.

To stop the ongoing stream the express server keeps track of the process IDs of the videos being streamed. If the user clicks the button called `Durdur` front end makes a request to the express server's `/stop` endpoint with the file's name. Then express finds the process ID related to the file name and terminates it using the `terminate` library.

Mediamtx serves RTSP stream on `localhost:8554/file_name` and also HLS stream on `localhost:8888/file_name/index.m3u8`


## Installation

To run this project locally follow these steps:

1) Clone the repository
```
git clone https://github.com/firatcanbozkurt/streaming-app.git
cd streaming-app
```

2) Use the docker engine to start the project (https://docs.docker.com/engine/install/)
```
docker-compose up
```
3) Now you can open up http://localhost:4200 (Angular)
