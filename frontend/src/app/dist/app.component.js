"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppComponent = void 0;
var core_1 = require("@angular/core");
var http_1 = require("@angular/common/http");
var common_1 = require("@angular/common");
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
var hls_video_player_component_1 = require("./hls-video-player/hls-video-player.component");
var button_1 = require("primeng/button");
var table_1 = require("primeng/table");
var AppComponent = /** @class */ (function () {
    function AppComponent(http) {
        this.http = http;
        this.videos = []; // Video array to store uploaded video informations
        this.currentVideoSource = '';
        this.isShowAvailable = false;
        this.isFileUploading = false;
    }
    AppComponent.prototype.ngOnInit = function () {
        this.fetchData(); // Fethcing video data from the server
    };
    AppComponent.prototype.fetchData = function () {
        var _this = this;
        this.http
            .get('http://localhost:3000/getVideoNames')
            .pipe(operators_1.catchError(this.handleError))
            .subscribe(function (response) {
            response.forEach(function (video) {
                video.isShowAvailable = false;
                video.isHls2Available = false;
            });
            _this.videos = response;
            console.log('Videos: ', _this.videos);
        });
    };
    AppComponent.prototype.onFileSelected = function (event) {
        var _this = this;
        var input = event.target;
        if (input.files && input.files.length > 0) {
            var file = input.files[0];
            var formData = new FormData();
            formData.append('file', file, file.name);
            this.isFileUploading = true;
            this.http
                .post('http://localhost:3000/upload', formData)
                .pipe(operators_1.catchError(this.handleError))
                .subscribe(function (response) {
                console.log('File has uploaded! : ', response);
                _this.videos.push({
                    name: response.fileName,
                    rtspUrl: response.rtspUrl,
                    hlsUrl: response.hlsUrl,
                    hls2Url: response.hls2Url
                });
                _this.isFileUploading = false;
            });
        }
    };
    AppComponent.prototype.startStream = function (video) {
        var _this = this;
        this.http
            .post('http://localhost:3000/start', { fileName: video.name })
            .pipe(operators_1.catchError(this.handleError))
            .subscribe();
        this.videos.find(function (v) { return v.name === video.name; }).isShowAvailable = true;
        setTimeout(function () {
            _this.videos.find(function (v) { return v.name === video.name; }).isHls2Available = true;
        }, 11000);
        console.log('Video: ', this.videos);
    };
    AppComponent.prototype.stopStream = function (video) {
        this.http
            .post('http://localhost:3000/stop', { fileName: video.name })
            .pipe(operators_1.catchError(this.handleError))
            .subscribe();
        this.videos.find(function (v) { return v.name === video.name; }).isShowAvailable = false;
        this.videos.find(function (v) { return v.name === video.name; }).isHls2Available = false;
    };
    AppComponent.prototype.showStream = function (video) {
        video.name = video.name.split('.')[0] + '.m3u8';
        this.currentVideoSource = "http://localhost:3000/videos/" + video.name;
    };
    AppComponent.prototype.hideStream = function () {
        console.log('Hiding stream');
        this.currentVideoSource = '';
    };
    AppComponent.prototype.handleError = function (error) {
        console.error('An error occurred:', error.message);
        return rxjs_1.throwError('Something went wrong; please try again later.');
    };
    AppComponent = __decorate([
        core_1.Component({
            selector: 'app-root',
            templateUrl: './app.component.html',
            styleUrls: ['./app.component.css'],
            standalone: true,
            imports: [
                http_1.HttpClientModule,
                common_1.CommonModule,
                hls_video_player_component_1.VideoPlayerComponent,
                button_1.ButtonModule,
                table_1.TableModule,
            ]
        })
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
