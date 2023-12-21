function createFPSCounter() {
  let startTime = performance.now();
  let frameCount = 0;
  
  let fps = 60//"Calculating..."
  
  function calculateFPS(frameDelay) {
    const elapsed = (performance.now() - startTime);
    frameCount+=1//frameDelay;
    if (elapsed >= 1000) {
      //const fps = (frameCount / (elapsed / 1000)).toFixed(2);
      fps = Math.floor(fps+frameCount)/2
      frameCount = 0
      startTime = performance.now()
      //return fps;
      
    }
    return fps
  }
  return calculateFPS;
}
const getFPS = createFPSCounter();


canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect(); // Get canvas dimensions and position
  mx = (e.clientX - rect.left) * (canvas.width / rect.width);  // Calculate relative x-coordinate
  my = (e.clientY - rect.top) * (canvas.height / rect.height); // Calculate relative y-coordinate
  
  let closeCars = 0  
   
  let closestDist = 100
  let closestCar
    
  for(let i = 0; i<agents.length; i++){
    let car = agents[i]
    let dist = distance(car.x*ScrnMult, car.y*ScrnMult, mx, my)
    if(dist<closestDist){
      closestDist = dist
      closestCar = i
      closeCars++
    }        
  }
  
  if(closeCars == 0){
    spectatedCar = "none"
    cont.style.top = "0px"
    cont.style.left = "0px"
    camX = 0
    camY = 0   
  }else{
    if(spectatedCar == closestCar){
      agents[spectatedCar].selfThrottle += 5
    }
    spectatedCar = closestCar    
  }
});
window.addEventListener("orientationchange", ()=>{let jsshsh = setTimeout(()=>{camMult = canvas.width/canvas.getBoundingClientRect().width},1000)});

document.getElementById("turnBias").addEventListener("change", ()=>{
  turnBias = document.getElementById("turnBias").value
})

document.getElementById("seed").addEventListener("change", ()=>{
  simSeed = document.getElementById("seed").value
  
})

//let OneWayToggle = true
function changeOneWay() {
  if(oneWay){
    oneWay = false
    document.getElementById("oneWay").innerHTML = "\"twoWay\""
  }else{
    oneWay = true
    document.getElementById("oneWay").innerHTML = "\"oneWay\""
  }
}

let raceType = "d1"

function changeRaceType() {
  if(raceType == "drift"){
    raceType = "f1"
    document.getElementById("type").innerHTML = "\"f1\""
    speedSlowage = 0.6
    //norm: 0.7, drift: 0.94
    throttle = 0.4
    //norm: 0.25, drift: 0.058
    dirSlowage = 0.8//0.3
    //norm: 0.7, drift: 0.5
    turnStrength = 0.4//0.85
    
  }else{
    raceType = "drift"
    document.getElementById("type").innerHTML = "\"drift\""
    speedSlowage = 0.94//0.94
    //norm: 0.7, drift: 0.94
    throttle = 0.058
    //norm: 0.25, drift: 0.058
    dirSlowage = 0.5//0.8//0.3
    //norm: 0.7, drift: 0.5
    turnStrength = 0.3//0.85
    
    /*speedSlowage = 0.6//0.94
    //norm: 0.7, drift: 0.94
    throttle = 0.4
    //norm: 0.25, drift: 0.058
    dirSlowage = 0.85//0.3
    //norm: 0.7, drift: 0.5
    turnStrength = 0.5//0.85*/
    
  }
}


function changeGlobalC() {
  if(globalC){
    globalC = false
  }else{
    globalC = true
  }
}

let currentMap = 0
function changeMap() {
  if(restarting){
    return
  }
  currentMap = (currentMap+1)%maps.length
  document.getElementById("mapSelector").innerHTML = currentMap
  startSim(maps[currentMap])
}

function spectateFastestCar() {
  let fastestCar = 0
  let fastestSpeed = 0
  
  for(let i = 0; i<agents.length; i++){
    if(agents[i].speedBias>fastestSpeed){
      fastestCar = i
      fastestSpeed = agents[i].speedBias
    }
  }
  
  spectatedCar = fastestCar
  
}




