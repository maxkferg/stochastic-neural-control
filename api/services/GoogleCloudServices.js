const Cloud = require('@google-cloud/storage')

const { Storage } = Cloud

const storage = new Storage({
  keyFilename: process.env.GOOGLE_SERVICE_KEY,
  projectId: process.env.GOOGLE_PROJECT_ID,
})

const googleCLoudServices = {};


googleCLoudServices.upImage = (file) => new Promise((resolve, reject) => {
    const { originalname, buffer } = file
  
    const blob = bucket.file(originalname.replace(/ /g, "_"))
    const blobStream = blob.createWriteStream({
      resumable: false
    })
    blobStream.on('finish', () => {
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      )
      resolve(publicUrl)
    })
    .on('error', () => {
      reject(`Unable to upload image, something went wrong`)
    })
    .end(buffer)
  })
modules.exports = googleCLoudServices