let canvas = document.getElementById("canvas")
let ctx = canvas.getContext('2d', {imageSmoothingEnabled: false})
let canvas2 = document.getElementById("background")
let ctx2 = canvas2.getContext('2d', {imageSmoothingEnabled: false})

let ScrnScale = 10//10
let ScrnMult = ScrnScale/14

let cont = document.getElementById("container")

function resizeScreen(sizeW, sizeH) {
  canvas.width = sizeW
  canvas.height = sizeH
  canvas2.width = sizeW
  canvas2.height = sizeH
}

let DR = Math.PI/180

class car{
  constructor(x, y, dir, col, id){
    //values
    this.x = x
    this.y = y
    this.sx = 0 // speed x
    this.sy = 0 // speed y
    this.lastSx = 0
    this.lastSy = 0
    this.dir = dir
    this.sdir = 0 // speed dir
    this.col = col
    this.id = id
    this.stuckCounter = 0
    this.Gs = 0
    
    //idk
    this.randRoadBias = 0
    this.speedBias = 1 + (randBool(id) - 0.5)
    
    this.selfThrottle = 0
    this.preferredTurnDir = randBool(id)>0.5 
                           ? (1.5)*DR : (-1.5)*DR
    //console.log(this.speedBias, this.col)
    
    //opt
    this.innerLeftDist = 0
    this.innerRightDist = 0
    this.farLeftDist = 0
    this.farRightDist = 0
    this.midDist = 0
    
    this.leftSideDist = 0
    this.rightSideDist = 0
    
  }
  update(){
    let tileIndex = Math.floor(this.x/tileWidth)+(Math.floor(this.y/tileHeight)*mapWidth)
    
    let currentTile = map[tileIndex]
    
    let dirSin = Math.sin(this.dir)
    let dirCos = Math.cos(this.dir)
    
    if(oneWay){
    switch(currentTile){
      case 2:
        if(this.dir>Math.PI || this.dir<0){
          this.dir = 90*DR
        }
        break
      case 5:
        if(this.dir<Math.PI && this.dir>0){
          this.dir = -90*DR
        }
        break
      case 7://8
        if (this.dir > 0.5 * Math.PI && this.dir < 1.5 * Math.PI) {
          this.dir = 0*DR
        }
        break;
      case 8://7
        if (this.dir < 0.5 * Math.PI || this.dir > 1.5 * Math.PI) {
          this.dir = 180*DR
        }
        break;
    }
    }
    
    let nearAgents = densMap[tileIndex]  
    let avSdir = 0 //average sdir  
    for(let i = 0; i<nearAgents.length;i++){
      let index = nearAgents[i]
      if(index == this.id){
        continue
      }
      let dist = distance(agents[index].x, agents[index].y, this.x, this.y)
      if(dist<carWidth*2){
        let a = Math.atan2(agents[index].x-this.x, agents[index].y-this.y)
        let dx = Math.sin(a)
        let dy = Math.cos(a)
        
        let t = (dist-carWidth*2)/50
        //console.log(t)
        
        //update cur
        this.sx += dx*t
        this.sy += dy*t
        /*if(!bounded(this.x, this.y, this.id, "wall")){
          this.x -= dx*t
          this.y -= dy*t        
        }*/
        
        agents[index].sx -= dx*t
        agents[index].sy -= dy*t
        /*if(!bounded(agents[index].x, agents[index].y, agents[index].id, "wall")){
          agents[index].x += dx*t
          agents[index].y += dy*t        
        }*/     
      }
      avSdir += agents[index].sdir
    }
    if(nearAgents.length>1){
      this.sdir = (avSdir/(nearAgents.length-1))
      //this.col = "white"
    }
        
    //update values
    this.x += this.sx
    if(!bounded(this.x, this.y, this.id, "wall")){
      this.x -= this.sx
      this.sx *= -bounce  
    }
    this.y += this.sy
    if(!bounded(this.x, this.y, this.id, "wall")){
      this.y -= this.sy
      this.sy *= -bounce   
    }
    
    this.selfThrottle += 0.05
    
    this.sx *= speedSlowage
    this.sy *= speedSlowage
    this.selfThrottle *= 0.97//0.97
    this.sx += dirSin * (throttle)*(this.speedBias + this.selfThrottle)
    this.sy += dirCos * (throttle)*(this.speedBias + this.selfThrottle)
    
    let calculatedGs = distance(this.sx, this.sy, this.lastSx, this.lastSy)
    let colDeTo = 0.1 //collision detection tolerance 
    if(this.Gs-calculatedGs < colDeTo){
      this.Gs = (this.Gs*2+calculatedGs)/3
    }else{
      this.Gs *= 0.5//(this.Gs*5+calculatedGs)/6
      //this.col = "white"
    }
    
    this.sdir += turnBias*DR
    
    if(Math.abs(this.sdir)>1){
      this.sdir = 0
    }
        
    let stepAmount = 100/rayStepDist
    let stepAmount2 = 80/rayStepDist
    let stepAmount3 = 20/(rayStepDist)
    
    let dAT = 10/rayStepDist //distance amount translation 
    
    //ray firing
    ctx.lineWidth = 1
    
    this.innerLeftDist = fireRay(this.x, this.y, this.dir + DR * 15, stepAmount, rayStepDist, this.id, "all")*dAT
    this.innerRightDist = fireRay(this.x, this.y, this.dir - DR * 15, stepAmount, rayStepDist, this.id, "all")*dAT
    
    this.farLeftDist = fireRay(this.x, this.y, this.dir + DR * 35, stepAmount, rayStepDist, this.id, "all")*dAT
    this.farRightDist = fireRay(this.x, this.y, this.dir - DR * 35, stepAmount, rayStepDist, this.id, "all")*dAT
      
    this.midDist = fireRay(this.x, this.y, this.dir, stepAmount2, rayStepDist, this.id, "car only")*dAT
    
    this.leftSideDist = fireRay(this.x, this.y, this.dir + DR * 70, stepAmount3, rayStepDist, this.id, "all")*dAT
    this.rightSideDist = fireRay(this.x, this.y, this.dir - DR * 70, stepAmount3, rayStepDist, this.id, "all")*dAT
    
    //anti stuck system
    let frontDist = (this.innerLeftDist+this.innerRightDist)/2
    if(frontDist < 2){
      if(this.stuckCounter > 50){
        this.selfThrottle += -0.5
      }else{
        this.stuckCounter += 1
      }
    }else{
      this.stuckCounter = 0            
    }
    
    //overtaking logic
    if(this.midDist < stepAmount2*dAT-1){
      this.selfThrottle += 0.03
    }
    if(this.midDist < stepAmount2*dAT-1){
      this.sdir += this.preferredTurnDir
    }
    
    if((time+this.id)%360 == 0) { 
      this.randRoadBias = (randBool(this.id*2+11) - 0.5)*10
    }
    
    //turn logic
    this.sdir += ((this.farLeftDist-this.farRightDist)+(this.randRoadBias))*0.4*DR
    this.sdir += (this.innerLeftDist-this.innerRightDist)*0.5*DR    
    this.sdir += (this.leftSideDist-this.rightSideDist)*3*DR
    
    if(Math.abs(this.leftSideDist-this.rightSideDist)>0.5 && time%20 == 0){
      this.preferredTurnDir *= -1
      //this.selfThrottle += 1
      this.sdir += this.preferredTurnDir*2
      //this.col = "white"
    }
    
    if(this.farLeftDist > this.farRightDist){
      this.sdir += DR * 1
    }else if(this.farLeftDist < this.farRightDist){
      this.sdir -= DR * 1
    }
    
    let Gs = this.Gs+1
    
    this.sdir *= dirSlowage
    
    let turnAmount = this.sdir
        
    if(raceType == "drift"){
      turnAmount *= Gs**6
    }   
    
    this.sdir += turnAmount*turnStrength
    
    let sdirLimit = 0.08
    
    this.sdir = Math.min(this.sdir, sdirLimit)
    this.sdir = Math.max(this.sdir, -sdirLimit)
    
    
    this.dir += this.sdir//turnAmount
    
    //normalize dir
    if(this.dir<0){
      this.dir += Math.PI * 2
    }
    if(this.dir>Math.PI * 2){
      this.dir -= Math.PI * 2
    }
    
    
    ctx2.globalAlpha = this.Gs
    ctx2.fillRect((this.x-5)*ScrnMult, (this.y-5)*ScrnMult, 10*ScrnMult, 10*ScrnMult)
    
    this.lastSx = (this.sx+this.lastSx)/2
    this.lastSy = (this.sy+this.lastSy)/2
    
    /*if(raceType == "drift"){
      let tGs = this.Gs
      tGs = tGs * 20
    
      let tMaxDir = 60
      let tDirAdd = this.sdir*tGs
      if(Math.abs(tDirAdd)>tMaxDir*DR){
        if(tDirAdd>0){
          tDirAdd = tMaxDir*DR
        }else{
          tDirAdd = -tMaxDir*DR
        }
      }
      
      dirSin = Math.sin(this.dir+tDirAdd)
      dirCos = Math.cos(this.dir+tDirAdd)    
    }*/
    
    ctx.lineWidth = 10*ScrnMult
    //draw car
    ctx.strokeStyle = this.col
    ctx.beginPath()
    ctx.moveTo(
    (this.x+(dirSin * 10))*ScrnMult,
    (this.y+(dirCos * 10))*ScrnMult)
    ctx.lineTo(
    (this.x-(dirSin * 10))*ScrnMult,
    (this.y-(dirCos * 10))*ScrnMult)
    ctx.stroke()
    
    ctx.lineWidth = 8*ScrnMult
    //draw car
    ctx.strokeStyle = "#222"//this.col
    ctx.beginPath()
    ctx.moveTo(
    (this.x+(dirSin * 5.5))*ScrnMult,
    (this.y+(dirCos * 5.5))*ScrnMult)
    ctx.lineTo(
    this.x*ScrnMult,
    this.y*ScrnMult)
    ctx.stroke()
    
    //ctx.strokeStyle = "#222"//this.col
    ctx.beginPath()
    ctx.moveTo(
    (this.x-(dirSin * 4))*ScrnMult,
    (this.y-(dirCos * 4))*ScrnMult)
    ctx.lineTo(
    (this.x-(dirSin * 7))*ScrnMult,
    (this.y-(dirCos * 7))*ScrnMult)
    ctx.stroke()
    
  }
  
  addToTile(){
    if(!globalC){
      ctx.clearRect((this.x-14)*ScrnMult, (this.y-14)*ScrnMult, 28*ScrnMult, 28*ScrnMult)
    }
    
    let x = Math.floor(this.x/tileWidth)
    let y = Math.floor(this.y/tileHeight)
    
    let radius = 1//4
    
    for(let i = -radius; i<radius; i++){
      for(let j = -radius; j<radius; j++){
        densMap[x+i+(y+j)*mapWidth].push(this.id)
      }
    }
    
    /*let x = Math.floor(this.x/tileWidth)
    let y = Math.floor(this.y/tileHeight)
    
    densMap[x+y*mapWidth].push(this.id)
    densMap[x+1+(y)*mapWidth].push(this.id)
    densMap[x-1+(y)*mapWidth].push(this.id)
    densMap[x+1+(y+1)*mapWidth].push(this.id)
    densMap[x-1+(y+1)*mapWidth].push(this.id)
    densMap[x+(y+1)*mapWidth].push(this.id)
    densMap[x+1+(y-1)*mapWidth].push(this.id)
    densMap[x-1+(y-1)*mapWidth].push(this.id)
    densMap[x+(y-1)*mapWidth].push(this.id)*/
    
  }
}

function fireRay(x, y, dir, max, stepDis, ignore, detectable) {
  //setting vars
  let visible = ignore == spectatedCar
  let strtX = x
  let strtY = y
  let dist = 0
  let dx = Math.sin(dir) * stepDis
  let dy = Math.cos(dir) * stepDis
    
  while(bounded(x, y, ignore, detectable) && max > dist){
    x += dx
    y += dy
    dist++
    /*if(visible){
      ctx.fillRect(x-1, y-1, 2, 2)
    }*/
  }  
  rayStepsPerFrame += dist
  if(globalC){
    if(dist < max){
      ctx.strokeStyle = "cyan"
    }else{
      ctx.strokeStyle = "blue"
    }
  
    ctx.beginPath()
    ctx.moveTo(strtX*ScrnMult, strtY*ScrnMult)
    ctx.lineTo(x*ScrnMult, y*ScrnMult)
    ctx.stroke()
    //ctx.fillRect(x-1, y-1, 2, 2)
  }
  
  return dist
}

function bounded(x, y, ignore, detectable) {
  if(x < 0 || x > cnvsW){
    return false
  }
  if(y < 0 || y > cnvsH){
    return false
  }
  
  let gridIndex = Math.floor(x/tileWidth)+(Math.floor(y/tileHeight)*mapWidth)
  
  if(detectable == "all" || detectable == "wall"){
    let currentTile = map[gridIndex]
    
    let walls = [1, 4, 9, 10]
    if(walls.includes(currentTile)){
      return false
    }
  }
  
  if(detectable == "car only" || detectable == "all"){
    let cars = densMap[gridIndex]
    
    for(let i = 0; i < cars.length; i++){
      if(cars[i] == ignore){
        continue
      }
      let cx = agents[cars[i]].x
      let cy = agents[cars[i]].y
      if(distance(x, y, cx, cy)<carWidth){
        return false
      }
    }
  }
  return true
}

function drawCourse(context) {
  let tW = tileWidth*ScrnMult
  let tH = tileHeight*ScrnMult
  context.fillStyle = "#1d2"
  context.globalAlpha = 1
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.lineWidth = (tW+tH)/6.5;
  let hTW = tW / 2 //half tile width
  let hTH = tH / 2 //half tile height
  
  //hTW *= ScrnMult
  ///hTH *= ScrnMult
  
  let lastTile
       
  for (let i = 0; i < mapWidth*mapHeight; i++) {
    let tile = map[i];
    let x = i % mapWidth;
    let y = Math.floor(i / mapWidth);
    
    let xOff = x * tW
    let yOff = y * tH
    
    /*if(((x<1 || x>mapWidth-2) || (y<1 || y>mapWidth-2)) && randBool(i)*10>4){      
      context.clearRect(xOff, yOff, tileWidth, tileHeight)
      continue 
    }*/
    
    function drawCell() {
      context.fillRect(xOff, yOff, tW, tH)
    }

    switch (tile) {
      case 0: // (x*y%5) + (i+x*y%2) % 2 == 0
        //if((x*y)%12 === 0){
        if((randBool(i+x+y)) > 0.5){
          context.fillStyle = "#10d020"
          //context.fillStyle = "#222"
          drawCell()
        }
        
        break
      case 1:
        if((x+y) % 2 == 0){
          context.fillStyle = "#eff"
        }else{
          context.fillStyle = "#f12"
        }
        drawCell()
        break;
      case 3:
        context.fillStyle = "#333";
        drawCell()
        break;
      case 9:
        context.fillStyle = "#777";
        drawCell()
        break;
      case 10:
        context.fillStyle = "#108010"
        drawCell()
          
        context.fillStyle = "#20a020"      
        context.fillRect(xOff, yOff, hTW, hTH)
        context.fillRect(xOff+hTW, yOff+hTH, hTW, hTH)   
        
        break;
      case 4:
        context.beginPath()
        context.arc((xOff) + (hTW), (yOff) + (hTH), (hTW+hTW)/3.3, 0, 2 * Math.PI, false);
        context.stroke()
        break
      case 6:
        context.fillStyle = "#eff"
        drawCell()
        context.fillStyle = "#445"
        context.fillRect(xOff, yOff, hTW, hTH)
        context.fillRect(xOff+hTW, yOff+hTH, hTW, hTH)   
        break;
      case 11:
        if(map[i-mapWidth] == 11 && map[i+mapWidth] != 11){
          context.fillStyle = "#eff"
          drawCell()
          context.fillStyle = "#333"
          context.fillRect(xOff, yOff, hTW, hTH)
        }else if(map[i+mapWidth] == 11 && map[i-mapWidth] == 11){
          context.fillStyle = "#eff"//"#eff"
          drawCell()
          context.fillStyle = "#333"
          context.fillRect(xOff, yOff+hTH, hTW, hTH)      
          context.fillRect(xOff, yOff, hTW, hTH)          
        }else{
          context.fillRect(xOff, yOff, hTW, hTH)
          context.fillStyle = "#eff"
          drawCell()
          context.fillStyle = "#333"
          context.fillRect(xOff, yOff+hTH, hTW, hTH)
        }
        
        break;
        
      case 12:
        if(map[i-mapWidth*4] == 12){
          if((x+y)%2 == 0){
            context.fillStyle = "#d11"
          }else{
            context.fillStyle = "#ccc"
          }
          drawCell()
          
          context.fillStyle = "#777"
          context.fillRect(xOff, yOff, tW, tH/3)
          
          if(randBool(x+y)>0.3){
            let [red, green, blue] = hslToRgb(randBool(x*y)*360, 100, 50)   
            
            context.fillStyle = `rgb(${red}, ${green}, ${blue})`
            context.fillRect(xOff, yOff+hTH/2, tW, hTH)
            
            context.fillStyle = "#111"
            context.fillRect(xOff+hTW/2, yOff+hTH/2, hTW, hTH)
          }                    
        }else{
          context.fillStyle = "#ccc"
          drawCell()
          context.fillStyle = "#eee"
          context.fillRect(xOff, yOff, hTW, tH)
        }
        break  
      case 13:
        context.fillStyle = "#ddd"
        drawCell()
        context.fillStyle = "#aaa"
        context.fillRect(xOff, yOff, hTW, hTH)
        context.fillRect(xOff+hTW, yOff+hTH, hTW, hTH)  
        break
        
      default:
        context.fillStyle = "#333";
        //context.fillStyle = "#ff3";
        drawCell()        
        break;  
    }
    
    function tileShadow() {
      context.fillStyle = "black"
      drawCell()
      context.globalAlpha = 1
    }
    
    let high = [10, 1, 9, 12, 13]
    if(high.includes(map[i-mapWidth-1])){      
      if(!high.includes(tile) || randBool(i)*10>5){
        context.globalAlpha = 0.2
        tileShadow()
      }
    }else if(high.includes(map[i-mapWidth]) || high.includes(map[i-1])){     
      if(!high.includes(tile) || randBool(i)*10>5){
        context.globalAlpha = 0.1
        tileShadow()
      }    
    }
    lastTile = tile
  }
  context.globalAlpha = 0.1//0.01;
  context.fillStyle = "#2c2c2c" 
}

/*
    white   = 00 =         grass
    black   = 01 =          wall
    red     = 02 = right dir fix
    lime    = 03 =       asphalt 
    blue    = 04 =         tires
    magenta = 05 =  left dir fix
    yellow  = 06 =       finnish 
    cyan    = 07 =  down dir fix
    oragen  = 08 =    up dir fix
    violet  = 09 =  lighter curb
    bleach  = 10 =         trees
    mink    = 11 =   start slots
    maroon  = 12 =       audiens
    dk gree = 13 = meshed blockr
*/    

let restarting = false

function startSim(mapData) {
  if(restarting){
    return
  }
  restarting = true
  
  agents = []
  
  fetch(mapData.file)
    .then(response => response.text())
    .then(data => {
      map = data.split(",").map(value => parseInt(value.trim(), 10));
      drawCourse(ctx2)
      restarting = false
      gameLoop()
      carAmount = document.getElementById("carAmount").value
      
      //spawnCars()
      ctx.font = tileHeight*ScrnMult+"px arial"
      //document.getElementById("seed").value = simSeed
    })
    .catch(error => {
      console.error('Error:', error);
    });
  mapWidth = mapData.width
  mapHeight = mapData.height
  resizeScreen(mapWidth*ScrnScale, mapHeight*ScrnScale)//14
  tileWidth = 14//canvas.width / mapWidth
  tileHeight = 14//canvas.height / mapHeight
  cnvsW = mapWidth*14
  cnvsH = mapHeight*14

  
  densMap = []
  clearDensMap()
  
  spectatedCar = "none"
  camX = 0
  camY = 0
  camMult = canvas.width/canvas.getBoundingClientRect().width //window.innerWidth
  
  time = 0
  randCount = 0
  
  cont.style.top = camY+"px"
  cont.style.left = camX+"px"
  
  document.getElementById("mapData").innerHTML = JSON.stringify(mapData, null, 2).replace(/\n/g, "<br>").replace(/ /g, "&nbsp")+","
    
  //xOffset = tileHeight*mapData.x//*12
  //yOffset = tileHeight*mapData.y//*14
  xOffset = 14*mapData.x//*12
  yOffset = 14*mapData.y//*14
  ctx.imageSmoothingEnabled = false;
  ctx2.imageSmoothingEnabled = false;
  
}

let cnvsW
let cnvsH

let maps = [
  {file: 'rectMap.txt', width: 104, height: 80, x: 12, y: 21.5},
  {file: 'diagoMap.txt', width: 100, height: 84, x: 14, y: 25.5}, 
  {file: 'bigMap.txt', width: 80, height: 80, x: 4, y: 8}, 
  {file: 'audMap.txt', width: 100, height: 100, x: 25, y: 28},    
]

//global vars  
let map = [] 
let mapWidth
let mapHeight
let tileWidth 
let tileHeight 

let rayStepsPerFrame = 0

//dansity map
let densMap = []
clearDensMap()

function clearDensMap() {
  densMap = []
  for(let i = 0; i<mapWidth*mapHeight; i++){
    densMap.push([])
  }
}

let fps = getFPS(1)
let time = 0
let randCount = 0
let simSeed = 1
newSeed()
function newSeed() {
  simSeed = randBool(simSeed)*10000
  document.getElementById("seed").value = simSeed
}
/*for(let i = 0; i<10; i++){
  console.log(randBool(i))
}*/

let camX = 0
let camY = 0
let camMult = 3.111
let camFollowStrength = 1//1//10


//set car
let globalC = false

let spectatedCar = "none"

let speedSlowage = 0.94//0.94
//norm: 0.7, drift: 0.94
let throttle = 0.058
//norm: 0.25, drift: 0.058
let dirSlowage = 0.8//0.3
//norm: 0.7, drift: 0.5
let turnStrength = 0.3//0.85

let turnBias = 0
let oneWay = true

let breakPower = 0
let bounce = -0.7

let carWidth = 12
let carAmount = 100
let rayStepDist = 10
    
//spawning the cars
let xOffset = tileWidth*4//*12
let yOffset = tileHeight*7.5//*14

let agents = []

startSim(maps[0])
let theCleansing = setTimeout(()=>{startSim(maps[0]); document.getElementById("title").innerHTML="let selfDriving = [";raceType = "d1";changeRaceType()},3000)
    
function gameLoop() {
  //clear screen
  ctx.clearRect(0, 0, 100*ScrnMult, 90*ScrnMult)
  if(globalC || time == 0){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  
  
  rayStepsPerFrame = 0
  
  clearDensMap()
  
  rayStepDist = 10+(time%(10-tileWidth))//20//12
  
  if(spectatedCar != "none"){   
    camX += (((-agents[spectatedCar].x*ScrnMult+canvas.width/2)/camMult)-camX)/camFollowStrength
    camY += (((-agents[spectatedCar].y*ScrnMult+canvas.height/2)/camMult)-camY)/camFollowStrength
    
    cont.style.top = camY+"px"
    cont.style.left = camX+"px"
  }
  
  /*if(time%2 == 0){
    camMult = canvas.width/canvas.getBoundingClientRect().width //window.innerWidth  
  }else{
    camMult = canvas.width/window.innerWidth  
  }*/
  
   
  for(let a = 0; a<1; a++){
    for(let i = 0; i < agents.length; i++){
      agents[i].addToTile()
    }
    for(let i = 0; i < agents.length; i++){
      agents[i].update()
    }  
  }
 
 
  if(agents.length<carAmount){
    if(bounded(xOffset, yOffset, -1, "all")){
      let [red, green, blue] = hslToRgb((agents.length*(360/carAmount)), 100, 50)    
      agents.push(new car(
      xOffset,
      yOffset,
      DR*90,
      `rgb(${red}, ${green}, ${blue})`,
      agents.length))
    }
  }
    
  
  
  fps = getFPS(1)
  
  
  ctx.fillText("FPS: "+fps, 0, tileHeight*ScrnMult)
  ctx.fillText("RSPF: "+rayStepsPerFrame, 0, tileHeight*2*ScrnMult)
  ctx.fillText("ARPA: "+Math.floor(rayStepsPerFrame/agents.length), 0, tileHeight*3*ScrnMult)
  ctx.fillText("Agents: "+agents.length, 0, tileHeight*4*ScrnMult)
  
  
  time = (time + 1)%360
  
  if(!restarting){
    window.requestAnimationFrame(gameLoop)
  }
}
//let artloop = setInterval(gameLoop, 1000/10)

function debug() {
  
}

function distance(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;

  return Math.sqrt( a*a + b*b );
}

function hslToRgb(h, s, l) {
  //let hue = h
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
  
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
  
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};
  
function randBool(v){
  let a = v
  v += 2838+simSeed+randCount
  v *= 3979*v+a*a
  v = Math.floor((v*v)*1928)*v*2837631
  v *= v*11
  v *= v*v*39283*a
  v %= 1000000
  randCount++
  return v/1000000
}

