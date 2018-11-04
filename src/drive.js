const { join } = require("path");
const { createWriteStream } = require("fs");
const { google } = require("googleapis");
const { ESSAY_FOLDER_ID, ESSAYS_PATH } = require("../config.js");

const OPTIONS = {
  orderBy: `createdTime desc`,
  pageSize: 15,
  q: `'${ESSAY_FOLDER_ID}' in parents`
};

function fetchEssaysText(auth) {
  const drive = google.drive({
    version: "v3",
    auth
  });
  return new Promise((resolve, reject) => {
    drive.files.list(
      {
        ...OPTIONS,
        fields: "nextPageToken, files(id)"
      },
      (err, res) => {
        if (err) reject(err);
        else {
          const { files } = res.data;
          if (files && files.length) {
            downloadEssays(drive, files)
              .then(msgs => resolve(msgs))
              .catch(err => reject(err));
          } else {
            reject(Error("no files found."));
          }
        }
      }
    );
  });
}

function downloadEssays(drive, files) {
  return Promise.all(
    files.map(file =>
      downloadEssay(drive, file.id, join(ESSAYS_PATH, `${file.id}.txt`)).catch(
        err => err
      )
    )
  );
}

function downloadEssay(drive, fileId, filename) {
  return new Promise((resolve, reject) => {
    const dest = createWriteStream(filename);
    drive.files.export(
      {
        fileId,
        mimeType: "text/plain"
      },
      {
        responseType: "stream"
      },
      (err, res) => {
        if (err) reject(err);
        else
          res.data
            .on("end", () => {
              resolve(`finished downloading ${filename}`);
            })
            .on("error", err => {
              reject(Error(`error downloading ${filename}: ${err}`));
            })
            .pipe(dest);
      }
    );
  });
}

module.exports = fetchEssaysText;
