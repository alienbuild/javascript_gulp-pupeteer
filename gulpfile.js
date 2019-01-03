const gulp = require('gulp');
const through = require('through2');
const puppeteer = require('puppeteer');
const runSequence = require('run-sequence');

const shotIt = async (page, fileName) => {
    return new Promise(async(resolve, reject) => {
        try{

            // Create Delay Function
            function delay(time) {
               return new Promise(function(resolve) { 
                   setTimeout(resolve, time)
               });
           }

           // Set Puppeteer and Proceed to Files
           await page.setUserAgent("puppeteer");
           await page.goto(fileName);

           const bodyHandle = await page.$('body');

            // Set Desktop Viewport
            await page.setViewport({
                width: 1920,
                height: 1080
            });

            // If a button with data-toggle attr exists
            if ((await page.$('[data-toggle]')) !== null) {
                console.log('----- Modals Found -----');

                await delay(1000);

                // Grab all buttons
                const items = await page.$$('[data-toggle]');

                // For each button perform tasks
                for (let i = 0, length = items.length; i < length; i++) {

                    const item = await page.evaluateHandle((i) => {
                        const element = document.querySelectorAll('[data-toggle]')[i];
                        return element;
                    }, i);

                    // Click selector
                    await item.click();

                    // Get button text
                    let itemText = await (await item.getProperty('textContent')).jsonValue();
                    const modalName = itemText.trim();
                    const modalFileName = modalName.replace(/\s+/g, '-').toLowerCase();

                    // Wait for modal to slide in
                    await delay(2000);
                    
                    // Take Desktop Screenshot
                    console.log('[Modal #'+i+'] [' +modalName+'] [Desktop] Taking screenshot...');
                    await page.screenshot({
                        fullPage: true,
                        path: fileName+'-'+modalFileName+'_modal_desktop'.split(".html")[0]+".jpg"
                    });

                    // Set Mobile Viewport
                    await page.setViewport({
                        width: 375,
                        height: 812
                    });

                    // Take Mobile Screenshot
                    console.log('[Modal #'+i+'] [' +modalName+'] [Mobile] Taking screenshot...');
                    await page.screenshot({
                        fullPage: true,
                        path: fileName+'-'+modalFileName+'_modal_mobile'.split(".html")[0]+".jpg"
                    });

                    // Set Desktop Viewport
                    await page.setViewport({
                        width: 1920,
                        height: 1080
                    });

                    // Close Modal
                    await page.mouse.click(0, 0); // Work around as click element doesn't work after a few times.
                    console.log('---------');

                    // Wait for modal to slide out
                    await delay(2000);

                }

                // Take screenshot
                console.log('Taking screenshot of:', fileName);
                await page.screenshot({
                    fullPage: true,
                    path: fileName+'_desktop'.split(".html")[0]+".jpg"
                });

                } else{

                    console.log("No modals exists, taking desktop screenshot of: " + fileName);

                    // Set Desktop Viewport
                    await page.setViewport({
                        width: 1920,
                        height: 1080
                    });

                    // Take screenshot
                    await page.screenshot({
                        fullPage: true,
                        path: fileName+'_desktop'.split(".html")[0]+".jpg"
                    });

                    // Set Mobile Viewport
                    await page.setViewport({
                        width: 375,
                        height: 812
                    });

                     await page.screenshot({
                        fullPage: true,
                        path: fileName+'_mobile'.split(".html")[0]+".jpg"
                    });
                }

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
