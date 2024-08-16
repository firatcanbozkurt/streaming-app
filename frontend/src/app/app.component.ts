import { Component, OnInit } from '@angular/core';
import {
  HttpClientModule,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

interface Video {
  name: string;
  rtspUrl: string;
  hlsUrl: string;
  hls2Url: string;
  isShowAvailable?: boolean;
  isHls2Available?: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [HttpClientModule, CommonModule, ButtonModule, TableModule],
})
export class AppComponent implements OnInit {
  videos: Video[] = []; // Video array to store uploaded video informations
  currentVideoSource: string = '';
  isShowAvailable: boolean = false;
  isFileUploading: boolean = false;
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData(); // Fethcing video data from the server
  }

  fetchData(): void {
    this.http
      .get<Video[]>('http://localhost:3000/getVideoNames')
      .pipe(catchError(this.handleError))
      .subscribe((response: Video[]) => {
        response.forEach((video) => {
          video.isShowAvailable = false;
          video.isHls2Available = false;
        });
        this.videos = response;
        console.log('Videos: ', this.videos);
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file, file.name);
      this.isFileUploading = true;
      this.http
        .post<{
          fileName: string;
          rtspUrl: string;
          hlsUrl: string;
          hls2Url: string;
        }>('http://localhost:3000/upload', formData)
        .pipe(catchError(this.handleError))
        .subscribe((response) => {
          console.log('File has uploaded! : ', response);
          this.videos.push({
            name: response.fileName,
            rtspUrl: response.rtspUrl,
            hlsUrl: response.hlsUrl,
            hls2Url: response.hls2Url,
          });
          this.isFileUploading = false;
        });
    }
  }

  startStream(video: Video): void {
    this.http
      .post('http://localhost:3000/start', { fileName: video.name })
      .pipe(catchError(this.handleError))
      .subscribe();
    this.videos.find((v) => v.name === video.name)!.isShowAvailable = true;
    setTimeout(() => {
      this.videos.find((v) => v.name === video.name)!.isHls2Available = true;
    }, 11000);
    console.log('Video: ', this.videos);
  }

  stopStream(video: Video): void {
    this.http
      .post('http://localhost:3000/stop', { fileName: video.name })
      .pipe(catchError(this.handleError))
      .subscribe();
    this.videos.find((v) => v.name === video.name)!.isShowAvailable = false;
    this.videos.find((v) => v.name === video.name)!.isHls2Available = false;
  }

  showStream(video: Video): void {
    video.name = video.name.split('.')[0] + '.m3u8';
    this.currentVideoSource = `http://localhost:3000/videos/${video.name}`;
  }

  hideStream(): void {
    console.log('Hiding stream');
    this.currentVideoSource = '';
  }
  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.message);
    return throwError('Something went wrong; please try again later.');
  }
}
