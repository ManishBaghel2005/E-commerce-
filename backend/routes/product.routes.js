import express from    "express"
import multer from "multer"
import Path from "path"
import { addnewproduct, deleteproduct, getproductbyid, readproduct, searchProducts, updateproduct } from "../controllers/product.controllers.js"

const router = express.Router()

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,'./uploads');
    },
    filename:(req, file, cb)=>{
        const newFileName = Date.now()+Path.extname(file.originalname);
        cb(null, newFileName)
    }
})

const fileFilter = (req, file, cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null, true)
    }else{
        cb(new Error('only images are allowed'), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter:fileFilter,
    limits:{
        fileSize:1024 *1024 * 5
    }
})





router.post("/add",upload.single('imagepath'),addnewproduct)
router.get("/all",readproduct)
router.put("/update/:id",upload.single('imagepath'),updateproduct)
router.delete("/delete/:id",deleteproduct)
router.get("/:id", getproductbyid)  
router.get('/search', searchProducts);

export default router