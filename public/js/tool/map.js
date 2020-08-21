class World {
    constructor(img){
        this.img = img
        this.w = img.width
        this.h = img.height
    }
    render(renderer){
        renderer.drawImage(this.img, 0, 0, 500, 500)
    }
}
