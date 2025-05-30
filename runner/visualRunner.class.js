// Handle the image comparisons
const fs         = require('fs');
const PNG        = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const config     = require('../oryx.config');
const { OpenAI } = require('openai');
const { uploadFile,
    downloadFile,
    checkFileExists,
    copyFile,
 }  = require('../libs/s3');

let VisualRunner = class {

    constructor(project, viewport, browser) {
        this.project = project;
        this.viewport = viewport;
        this.browser = browser;
    }

    set imageTitles(title) {
        this.current = 'current_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.base = 'base_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.diff = 'diff_' + this.viewport + '_' + this.browser + '_' + title + '.png';
        this.currentS3Path = `${this.project}/${this.current}`;
        this.baseS3Path = `${this.project}/${this.base}`;
        this.diffS3Path = `${this.project}/${this.diff}`;
        this.currentPath = `./${this.currentS3Path}`;
        this.basePath = `./${this.baseS3Path}`;
        this.diffPath = `./${this.diffS3Path}`;
    }

    set markupTitles(title) {
        this.currentMarkup = 'current_' + this.viewport + '_' + this.browser + '_' + title + '.json';
        this.baseMarkup = 'base_' + this.viewport + '_' + this.browser + '_' + title + '.json';
        this.currentMarkupS3Path = `${this.project}/${this.currentMarkup}`;
        this.baseMarkupS3Path = `${this.project}/${this.baseMarkup}`;
        this.currentMarkupPath = `./${this.currentMarkupS3Path}`;
        this.baseMarkupPath = `./${this.baseMarkupS3Path}`;
    }

    copyCurrent(screenshot, markup) {
        if(!fs.existsSync(this.project)) fs.mkdirSync(this.project);
        if(fs.existsSync(screenshot)) {
            fs.copyFileSync(screenshot, this.currentPath);
        }
        if(fs.existsSync(markup)) {
            fs.copyFileSync(markup, this.currentMarkupPath);
        }
    }

    async checkBase(image) {
        const baseImage = await checkFileExists(`${this.project}/${this.base}`);
        
        if (baseImage) {
            if(!fs.existsSync(this.project)) fs.mkdirSync(this.project);
            await downloadFile(this.baseS3Path, this.basePath);

            return true;
        }

        copyFile(image, this.baseS3Path);

        return false;      
    }

    async checkBaseMarkup(markup) {
        const baseMarkup = await checkFileExists(`${this.project}/${this.baseMarkup}`);

        if (baseMarkup) {
            if(!fs.existsSync(this.project)) fs.mkdirSync(this.project);
            await downloadFile(this.baseMarkupS3Path, this.baseMarkupPath);

            return true;
        }

        uploadFile(markup, this.baseMarkupS3Path);

        return false;
    }

    comparePixels() {
        const current = PNG.sync.read(fs.readFileSync(this.currentPath));
        const base = PNG.sync.read(fs.readFileSync(this.basePath));
        const {width, height} = current;
        const diff = new PNG({width, height});
        
        const numDiffPixels = pixelmatch(current.data, base.data, diff.data, width, height, {threshold: 0.1});
        
        fs.writeFileSync(this.diffPath, PNG.sync.write(diff));

        uploadFile(this.currentPath, this.currentS3Path);
        uploadFile(this.diffPath, this.diffS3Path);

        return numDiffPixels;
    }

    compareMarkup() {
        const current = JSON.parse(fs.readFileSync(this.currentMarkupPath));
        const base = JSON.parse(fs.readFileSync(this.baseMarkupPath));
        const markups = base.report.markups;
        const results = [];
        for (const markup of markups) {
            const newMarkup = current.report.markups.find(m => m.locator === markup.locator);
            const diff = deepCompare(markup, newMarkup);
            results.push({
                locator: markup.locator,
                diff: diff,
            });
        }

        return results;
    }

    async compareAI() {
        // const openai = new OpenAI({ apiKey: config.openaiAPIKey });
        // const base64Image1 = fs.readFileSync(this.currentPath, { encoding: 'base64' });
        // const base64Image2 = fs.readFileSync(this.basePath, { encoding: 'base64' });
        // 
        // const response = await openai.chat.completions.create({
        //     model: 'gpt-4.1-mini',
        //     messages: [
        //     {
        //         role: 'user',
        //         content: [
        //         { type: 'text', text: 'Please analyze the two UI screenshots and briefly describe any visual layout differences. Focus on structure, alignment, spacing, and content changes.' },
        //         {
        //             type: 'image_url',
        //             image_url: { url: `data:image/png;base64,${base64Image1}` },
        //         },
        //         {
        //             type: 'image_url',
        //             image_url: { url: `data:image/png;base64,${base64Image2}` },
        //         },
        //         ],
        //     },
        //     ],
        //     max_tokens: 1000,
        // });

        // return response.choices[0].message.content;
        return "The two UI screenshots are visually very similar but have some distinct layout differences:\n\n1. **Login Button Positioning and Alignment:**\n   - In the first image, the \"Login\" button is centered horizontally with ample spacing above and below.\n   - In the second image, the \"Login\" button is shifted slightly downward and slightly to the right. It also appears accompanied by a small black rectangle or shape to its left, which is absent in the first image.\n\n2. **Spacing:**\n   - The vertical spacing between the text \"A user friendly interface...\" and the \"Login\" button is greater in the first image. In the second image, this spacing is reduced because of the lowered button position.\n   - The bottom text \"Yuvee - RSB\" is positioned similarly in both images near the bottom center, with no notable change.\n\n3. **Content:**\n   - Both screenshots contain the same texts, the light-bulb logo centered at the top, and the decorative purple-pink wave lines.\n   - The only content difference is the presence of the black rectangle/shape next to the login button in the second screenshot.\n\nOverall, the main visual/layout differences involve the positioning and slight misalignment of the login button in the second image and the appearance of the additional black shape on the left side of the login button. All other structural elements remain consistent."
    }

    formatResults(msg, pixel = 0) {
        return {
            result: msg,
            base: this.baseS3Path,
            current: this.currentS3Path,
            diff: this.diffS3Path,
            pixel_diff: pixel,
        }
    }
};

function deepCompare(obj1, obj2) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return null;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return null;
    }

    const results = [];

    for (let key of keys1) {
        if (obj1[key] != obj2[key]) {
            results.push({
                key: key,
                value1: obj1[key],
                value2: obj2[key],
            });
        }
    }

    return results;
}

module.exports = VisualRunner;
