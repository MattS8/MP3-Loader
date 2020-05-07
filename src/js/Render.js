const remote = require('electron').remote
const dialog = remote.dialog
const path = require('path')
const fs = require('fs')

const selectFolderBtn = document.getElementById('selectFolderBtn')
const filesSectedTxt = document.getElementById('filesSelected')

const browseMP3Location = document.getElementById('browseMP3LocationBtn')
const mp3LocationInput = document.getElementById('mp3LocationInput')
const sendToMP3Btn = document.getElementById('sendToMP3Btn')

const filesTable = document.getElementById('filesTable')
const sendToMP3ResultTxt = document.getElementById('sendToMP3ResultTxt')

var CurrentFilesStruct = undefined
var CurrentMP3Location = undefined

// Select MP3 Files
selectFolderBtn.addEventListener('click', () => {
    let options = {
        title: "Select Folder Containing MP3 Files",
        buttonLabel: "Select Folder",
        properties: ["openDirectory"]
      }

      let dir = dialog.showOpenDialogSync(options)
      console.log(dir)

      if (dir == undefined) return -2

      let fileStruct = getFileStruct(dir[0], undefined)

      if (fileStruct.error != undefined) {
          filesSectedTxt.innerHTML = "An error has occured: " + fileStruct.error.toString()

          return -1
      }

      for (let file of fileStruct.files) {
        console.log(JSON.stringify(file))
      }

      if (fileStruct.numberOfFiles > 1) {
        filesSectedTxt.textContent = "" + fileStruct.numberOfFiles + " files selected."
        filesSectedTxt.style.color = 'black'
        filesTable.innerHTML = getFilesTableHTML(fileStruct)
        CurrentFilesStruct = fileStruct
      } else {
        filesTable.innerHTML = ""
        filesSectedTxt.textContent = "No files selected."
        filesSectedTxt.style.color = 'grey'
        CurrentFilesStruct = undefined
      }
      
    })

// Set MP3 Location   
browseMP3Location.addEventListener('click', () => {
    let options = {
        title: "Select MP3 Folder to Copy Files To",
        buttonLabel: "Select MP3 Folder",
        properties: ["openDirectory"]
        }

    let dir = dialog.showOpenDialogSync(options)
    console.log(dir)

    if (dir == undefined) {
        mp3LocationInput.value = ""
        CurrentMP3Location = undefined
        return -2
    }

    mp3LocationInput.value = dir[0]
    CurrentMP3Location = dir[0]
})

// Send Files to MP3
sendToMP3Btn.addEventListener('click', () => {
    if (CurrentFilesStruct == undefined) {
        sendToMP3ResultTxt.style.color = 'red'
        sendToMP3ResultTxt.innerText = "No MP3 files were selected!"
        return -1
    }

    CurrentMP3Location = mp3LocationInput.value

    if (CurrentMP3Location == undefined || CurrentMP3Location == "") {
        sendToMP3ResultTxt.style.color = 'red'
        sendToMP3ResultTxt.innerText = "MP3 location was not set!" 
        return -2
    }


    sendToMP3ResultTxt.style.color = 'black'
    sendToMP3ResultTxt.innerText = "Copying... "

    if (CurrentFilesStruct.files[0] == undefined) {
        sendToMP3ResultTxt.style.color = 'red'
        sendToMP3ResultTxt.innerText = "No files found to copy! Did you select the right folder?" 
        return -3
    }

    copyAllFiles(CurrentFilesStruct.files, 0)

    // CurrentFilesStruct.files.forEach((file, index) => {
    //     let data = fs.readFileSync(path.join(file.location, file.fileName))
    //     let newLocationFolder = path.join(CurrentMP3Location, file.folder)
    //     let newLocation = path.join(CurrentMP3Location, file.folder, file.fileName)
    //     console.log("Writing " + newLocation + " ...")
    //     // sendToMP3ResultTxt.style.color = 'black'
    //     // sendToMP3ResultTxt.innerText = "(" + (((index+1) / CurrentFilesStruct.files.length) * 100) + "%) Writing " + newLocation + "... "
    //     fs.mkdirSync(newLocationFolder, { recursive: true })
    //     fs.writeFileSync(newLocation, data, {})
    // })
})


// --------- Helper Functions ---------
function copyAllFiles(files, index) {
    let file = files[index]

    if (file == undefined) {
        sendToMP3ResultTxt.style.color = 'green'
        sendToMP3ResultTxt.innerText = "Files copied to MP3 player!" 
        return
    }
        

    fs.readFile(path.join(file.location, file.fileName), (err, data) => {
      if (err) {
          console.log("(copyAllFiles) - Error: " + err)
          sendToMP3ResultTxt.style.color = 'red'
          sendToMP3ResultTxt.innerText = "Failed to copy files. Please try again."
          return -4 
      }
      
      let newLocationFolder = path.join(CurrentMP3Location, file.folder)
      let newLocation = path.join(CurrentMP3Location, file.folder, file.fileName)
      console.log("Writing " + newLocation + " ...")
      sendToMP3ResultTxt.style.color = 'black'
      sendToMP3ResultTxt.innerText = "Writing " + newLocation + "... "
      fs.mkdir(newLocationFolder, () => {
          fs.writeFile(newLocation, data, () => {
              copyAllFiles(files, index+1)
          })
      })
    })
}

function getFilesTableHTML(fileStruct) {
    let innerHTML = "<table id=\"filesTable\" style=\"margin-left: 20px; margin-right: 20px; display: inline-block; margin-top: 10px;\" class=\"table-striped\"><thead><tr><th><div>File Name</div></th><th><div>Folder Name</div></th><th><div>Location</div></th></tr></thead><tbody>"

    for (const file of fileStruct.files) {
        innerHTML += "<tr><td>" + file.fileName + "</td><td>" + file.folder + "</td><td>" + path.join(fileStruct.rootDir, file.folder) + "</td></tr>"
    }

    innerHTML += "</tbody></table>"

    return innerHTML
}

function getFileStruct(fullFilePath, fileStruct, folderPath) {
    // Initialize fileStruct if first time calling
    if (fileStruct == undefined) {
        fileStruct = {
            rootDir: fullFilePath,
            files: [],
            numberOfFiles: 0
        }
    }

    // try {
    //     const files = fs.readdirSync(fullFilePath)
    //     for (const file of files) {
    //         fileStruct.numberOfFiles++
    //         try {
    //             const pathToFile = path.join(fullFilePath, file)
    //             const stat = fs.statSync(pathToFile)
    //             const isDirectory = stat.isDirectory()
    //             if (isDirectory) {
    //                 // Recursively traverse folder and add all files to fileStruct
    //                 getFileStruct(pathToFile, fileStruct, folderPath != undefined ? path.join(folderPath, file) : file)
    //             } else {
    //                 fileStruct.files.push({
    //                     location: fullFilePath,
    //                     folder: folderPath == undefined ? "" : folderPath,
    //                     fileName: file,
    //                     stat: stat
    //                 })
    //             }
    //         } catch (err) {
    //             fileStruct.files.push({
    //                 location: fullFilePath,
    //                 folder: folderPath == undefined ? "" : folderPath,
    //                 fileName: file,
    //                 error: err
    //             })
    //         }
    //     }
    // } catch (err) {
    //     fileStruct.error = err
    // }

    try {
        let files = fs.readdirSync(fullFilePath)
        let sortedFiles = files.length > 1 
            ? files.sort((a, b) => {
                    return a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})
                })
            : files

        for (const file of sortedFiles) {
            fileStruct.numberOfFiles++
            try {
                const pathToFile = path.join(fullFilePath, file)
                const stat = fs.statSync(pathToFile)
                const isDirectory = stat.isDirectory()
                if (isDirectory) {
                    // Recursively traverse folder and add all files to fileStruct
                    getFileStruct(pathToFile, fileStruct, folderPath != undefined ? path.join(folderPath, file) : file)
                } else {
                    fileStruct.files.push({
                        location: fullFilePath,
                        folder: folderPath == undefined ? "" : folderPath,
                        fileName: file,
                        stat: stat
                    })
                }
            } catch (err) {
                fileStruct.files.push({
                    location: fullFilePath,
                    folder: folderPath == undefined ? "" : folderPath,
                    fileName: file,
                    error: err
                })
            }
        } 
    } catch (err) {
        fileStruct.error = err
    }

    return fileStruct
}