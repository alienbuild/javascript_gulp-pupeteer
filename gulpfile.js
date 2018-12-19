const gulp = require('gulp');
const through = require('through2');
const puppeteer = require('puppeteer');
const runSequence = require('run-sequence');

const shotIt = async (page, fileName) => {
    return new Promise(async(resolve, reject) => {
        try{
            await page.setUserAgent("puppeteer");
            await page.goto(fileName);
            await page.setViewport({
              width: 1920,
              height: 1080
          });
            const bodyHandle = await page.$('body');
            const bbb = Date.now();
            console.log("Taking screenshot of: " + fileName);
            await page.screenshot({
                fullPage: true,
                path: fileName.split(".html")[0]+".jpg"
            });
            await bodyHandle.dispose();
            resolve();
        }catch(err){
            reject(err);
        };
    });
};

const screenshots = () => {
    const array = [];
    const customPath = './content/dist/'; // Set path here
    return gulp.src(`${customPath}/**/**.html`)
    .pipe(through.obj( (chunk, enc, cb) => {
        console.log(chunk.path);
        array.push(chunk.path.split("/")[chunk.path.split("/").length - 1])
        cb(null, chunk);
    })).on('end', async() => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        for(let pageName of array){
            try{
                await shotIt(page, pageName);
            }catch(err){
                console.log('failed', pageName, err);
            }
        };
        await browser.close();
    });
};

// Screenshots
gulp.task('shot', screenshots);
