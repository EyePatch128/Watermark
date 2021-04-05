import express from "express"
import path from "path"
import Jimp from "jimp"
import multer from "multer"
import fs from "fs"
import archiver from "archiver"
import { v4 as uuidv4 } from 'uuid';


// Config
const DIR = path.resolve();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'tmp/')
    },
    filename: function (req, file, cb) {
      cb(null, uuidv4() + path.extname(file.originalname))
    }
  })
var upload = multer({ storage: storage })


const app = express();

// Midlewares
app.use(express.static('public'))


const OUTPUT = `${DIR}/output/output.jpg`

const merge = async (original, watermark)=>{
    const [image, logo] = await Promise.all([
        Jimp.read(original),
        Jimp.read(watermark)
      ]);

    logo.resize(image.bitmap.width / 10, Jimp.AUTO);

    const LOGO_MARGIN_PERCENTAGE = 5;
    const xMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;
    const yMargin = (image.bitmap.width * LOGO_MARGIN_PERCENTAGE) / 100;

    const X = image.bitmap.width - logo.bitmap.width - xMargin;
    const Y = image.bitmap.height - logo.bitmap.height - yMargin;

    return image.composite(logo, X, Y, [
        {
          mode: Jimp.BLEND_SCREEN,
          opacitySource: 0.1,
          opacityDest: 1
        }
    ]);
}

const deleteFile = filename =>{
    fs.unlink(filename, err=>{
        if(err)
            console.log("Error while deleting file (" + filename + "):" + err)
        console.log("File (" + filename + ") deleted successfully");
    })
}

const watermarkFiles = (files, dirID)=>{
    return new Promise((resolve, reject)=>{
        let count = 0;
        const watermarkPath = files.watermark[0].path;

        files.original.forEach(elem => {
            let id = uuidv4();
                
            merge(elem.path, watermarkPath)
                .then(image=>{
                    image.write(`${DIR}/tmp/${dirID}/${id}.jpg`);
                    count++;
                    deleteFile(elem.path);
                })
                .then(()=>{
                    if(count == files.original.length){
                        deleteFile(watermarkPath);
                        resolve()
                    }
                })
                .catch(err=>{
                    console.log(err);
                    reject()
                });
        });
    })
    
}

app.get("/", (req, res)=>{
    res.status(200).sendFile(`${DIR}/index.html`);
})

app.post("/merge", upload.fields([{name: "original"}, {name:"watermark"}]), (req, res)=>{

    const dirID = uuidv4();
    const zipPath = `tmp/${uuidv4()}.zip`

    watermarkFiles(req.files, dirID)
        .then(()=>{
            // const output = fs.createWriteStream(zipPath)
            const archive = archiver("zip")
        
            // output.on('close', function () {
            //     console.log(archive.pointer() + ' total bytes');
            //     console.log('archiver has been finalized and the output file descriptor has closed.');
            //     fs.rmdir(`tmp/${dirID}`, { recursive: true }, (err) => {
            //         if (err) {
            //             throw err;
            //         }
                
            //         console.log(`tmp/${dirID} is deleted!`);
            //     });
            // });
        
            archive.on('error', function(err){
                throw err;
            });

            
            archive.on("end", ()=>{
                fs.rmdir(`tmp/${dirID}`, { recursive: true }, (err) => {
                    if (err) {
                        throw err;
                    }
                
                    console.log(`tmp/${dirID} is deleted!`);
                });
                res.end();
                console.log("File sent!")
            })

            res.set({
                'Content-Type': 'application/zip',
                "Content-Disposition": `attachment; filename=${dirID}`
            })
            archive.pipe(res);
            archive.directory(`tmp/${dirID}/`, false);
            archive.finalize();
        })
        .catch(err=>{
            throw err;
        })


    
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log("Listening on port ", PORT)
})