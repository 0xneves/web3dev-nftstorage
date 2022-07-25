import { NFTStorage, File, Blob } from "nft.storage"
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

const API_KEY = process.env.NFT_STORAGE
const totalImages = 1

async function uploadImageToNFTStorage(i) {
  const image = new File(
    [await fs.promises.readFile('images/web3dev-'+i+'.png')],
    { type: 'image/png' }      
  );
  const client = new NFTStorage({ token: API_KEY })
  const cidImage = await client.storeBlob(image)
  return cidImage
}

async function tryToUploadImg(i) {
  console.log("Uploading id:", i)
  try {
    const cidImage = await uploadImageToNFTStorage(i)
    return cidImage
  } catch (err) { console.error(err) }
  return tryToUploadImg(i)
}

async function tryToUploadMeta(cidImage, index) {
  const metadado = await fs.readFileSync('metadata/web3dev-'+index+'.json', 'utf8')
  let jsonRetrieved = await JSON.parse(metadado)
  try {
    let data = {
      id: jsonRetrieved['id'],
      image: 'https://ipfs.io/ipfs/'+cidImage,
      name: jsonRetrieved['name'],
      attributes: jsonRetrieved['attributes']
    }    
    const client = new NFTStorage({ token: API_KEY })
    const blobCreated = new Blob([JSON.stringify(data)]);
    const cidMetadata = await client.storeBlob(blobCreated);
    return cidMetadata
  } catch (err) { console.log(err) }
  return tryToUploadMeta(cidImage, index)
}

async function main() {
  const fileSream = fs.createWriteStream('out/cid-metadata.json')
  for(let i = 1; i < totalImages+1; i++){
    let cidImage = await tryToUploadImg(i)
    let cidMetadata = await tryToUploadMeta(cidImage, i)
    let data = {
      id: i,
      cid: cidMetadata
    }
    fileSream.write(JSON.stringify(data)+'\n')
  }
}

main().catch((error) => { console.error(error); process.exit(1);})
