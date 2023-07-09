"use strict";

const tactics=[{
  name: "balanced",
  frontline: 40,
  leftFlank: 20,
  rightFlank: 20,
  skirmish: 10,
  reserves: 10
},
{
  name: "hellenic",
  frontline: 45,
  leftFlank: 10,
  rightFlank: 30,
  skirmish: 5,
  reserves: 10,
},
{
  name: "pincher",
  frontline: 20,
  leftFlank: 30,
  rightFlank: 30,
  skirmish: 10,
  reserves: 10,
},
{
  name: "frontal charge",
  frontline: 80,
  leftFlank: 10,
  rightFlank: 10,
  skirmish: 0,
  reserves: 0,
},
{
  name: "harassment",
  skirmish: 80,
  frontline: 0,
  leftFlank: 0,
  rightFlank: 0,
  reserves: 20,
},
{
  name: "roman",
  frontline: 40,
  leftFlank: 10,
  rightFlank: 10,
  skirmish: 10,
  reserves: 30,
},
{
  name: "scythian",
  frontline: 10,
  leftFlank: 25,
  rightFlank: 25,
  skirmish: 30,
  reserves: 10,
},
{
  name: "reinforced left",
  frontline: 30,
  leftFlank: 40,
  rightFlank: 10,
  skirmish: 10,
  reserves: 10,
}
]




class Side {
  constructor(args/*regiments, distances, morale*/) {
    this.regiments = args.regiments;
    this.host=args.root;
    this.element=document.createElement("div");
    this.element.classList.add("side");
    this.host.appendChild(this.element);
    this.createElements();
    this.distances = args.distances;
    this.allBatallions = this.getAllBatallions();
    this.originalStrength = this.getTotalStrength();
    this.leftFlank = [];
    this.rightFlank = [];
    this.skirmish = [];
    this.frontline = [];
    this.reserves = [];
    this.morale = 100;
    this.totalSkirmish = this.getTotalSkirmish();
    this.totalMelee = this.getTotalMelee();
    this.totalShock = this.getTotalShock();
    this.tactic=this.getTactic();

    this.deployBatallions();

    
    console.error("ITT VAGYUNK? ", this);
  }

  createElements(){
    this.leftFlankElement=document.createElement("div");
    this.leftFlankElement.classList.add("leftFlank");
    this.element.appendChild(this.leftFlankElement);
    this.rightFlankElement=document.createElement("div");
    this.rightFlankElement.classList.add("rightFlank");
    this.element.appendChild(this.rightFlankElement);
    this.skirmishElement=document.createElement("div");
    this.skirmishElement.classList.add("skirmish");
    this.element.appendChild(this.skirmishElement);
    this.frontlineElement=document.createElement("div");
    this.frontlineElement.classList.add("frontline");
    this.element.appendChild(this.frontlineElement);
    this.reservesElement=document.createElement("div");
    this.reservesElement.classList.add("reserves");
    this.element.appendChild(this.reservesElement);
  }

  createUnitCard(batallion){
    const unitCard=document.createElement("div");
    unitCard.classList.add("unitCard");
    unitCard.innerHTML=`<div class="unitName">${batallion.unit}</div>
    <div class="unitStrength">❤️:${batallion.strength}</div>
    <div class="unitSkirmish">🏹:${batallion.skirmish}⚔️:${batallion.melee}</div>
    <div class="unitShock">🐴:${batallion.shock}🛡️:${batallion.armor}</div>
   `
    return unitCard;
  }
  
/**sums the strengths of batallions */
  getTotalStrength(){
    let totalStrength=0;
    this.allBatallions.forEach(batallion=>{
      totalStrength+=batallion.strength;
    })
    return totalStrength;
  }

  getAllBatallions() {
    let allBatallions = [];
    const regimentCompositionElementContainer = document.createElement("div");
    regimentCompositionElementContainer.classList.add("regimentCompositionContainer");
    this.element.appendChild(regimentCompositionElementContainer);
    this.regiments.forEach(regiment => {
      allBatallions = allBatallions.concat(regiment.batallions);
      const regimentCompositionElement=this.updateComposition(regiment);
      console.error("regimentCompositionElement: ", regimentCompositionElement)
     // regimentCompositionElementContainer.appendChild(regimentCompositionElement);
    });
    
    return allBatallions;
  
  }

  updateComposition(regiment) {
    const composition = document.createElement("div");
    composition.innerHTML = options.military
      .map(u => {
        if(!regiment.unitCounts[u.name]) return "";
        return `<div class="batallionName" data-tip="${capitalize(u.name)}">
      <div style="display:table-cell"> ${regiment.unitCounts[u.name]} batallions of ${capitalize(u.name)}</div>
       </div>`;
      })
      .join("");
      return composition;
  }

   getTotalSkirmish() {
    let total=0;
    if(this.regiments.length){
    this.regiments.forEach(regiment => {
      total+=this.getTotalSkirmishOfRegiment(regiment);
    });}
    return total;
  }
  getTotalSkirmishOfRegiment(regiment){
    let total=0;
    regiment.batallions.forEach(batallion => {
      total+=(batallion.strength/100)*batallion.skirmish;
    });
    return total;
  }
  getTotalMelee(){
    let total=0;
    this.regiments.forEach(regiment => {
     total+=this.getTotalMeleeOfRegiment(regiment);
    });
    return total;
  }
getTotalMeleeOfRegiment(regiment){
    let total=0;
    regiment.batallions.forEach(batallion => {
      total+=(batallion.strength/100)*batallion.melee;
    });
    return total;
}
  getTotalShock(){
    let total=0;
    this.regiments.forEach(regiment => {
     total+=this.getTotalShockOfRegiment(regiment);
    });
    return total;
  }

  getTotalShockOfRegiment(regiment){
    let total=0;
    regiment.batallions.forEach(batallion => {
      total+=(batallion.strength/100)*batallion.shock;
    });
    return total;
  }
  /**
   * gets one of the tactics from the tactics array based on the ratio of the total stats of the side and the ratios of the tatics. For that purpouse, it
   * equates the melee stat with the frontline zone in the tactic, the shock stat with the sum of the flanks in the tactic, the skirmish stat with the skirmish zone and ignores
   * the reserves of the tactic. It gathers the 3 best matching tactics, and chooses one of them randomly, then returns that tactic.
   */
  getTactic(){
    const totalStats={melee:this.totalMelee,shock:this.totalShock,skirmish:this.totalSkirmish};
    //let's normalize the totalstats as percentages of the total of all stats
    const total=totalStats.melee+totalStats.shock+totalStats.skirmish;
    const normalizedStats={melee:totalStats.melee/total*100,shock:totalStats.shock/total*100,skirmish:totalStats.skirmish/total*100};
    const matchingTactics=[];
    tactics.forEach(tactic=>{
      let differenceSum=0;
      differenceSum+=Math.abs(tactic.frontline-normalizedStats.melee);
      differenceSum+=Math.abs(tactic.leftFlank+tactic.rightFlank-normalizedStats.shock);
      differenceSum+=Math.abs(tactic.skirmish-normalizedStats.skirmish);
      matchingTactics.push({tactic:tactic,difference:differenceSum});
    });
    matchingTactics.sort((a,b)=>a.difference-b.difference);
    console.log("matcingtactics",matchingTactics)
    const chosenIndex=Math.floor(Math.random()*3);
    const chosenTactic=matchingTactics[chosenIndex].tactic;

    return chosenTactic;
  }
  
 

  /**
   * Assigns batallions to zones (this.frontline, this.leftFlank, this.rightFlank, this.skirmish, this.reserves) based on the tactic of the side and the stats of the batallions.
   * Tries to keep the ratio of the batallions as close to the ratio of the zones as possible, and prefers to assign batallions with higher stats to zones with higher ratios.
   * Also tries to assign batallions with the appropriate stats to the appropriate zones.
   * 
   */
  deployBatallions(){
    this.allBatallions.forEach(batallion=>{
      batallion.assigned=false;
    });
    //every batallion get's a number for every zone, based on how well it fits the zone and how high the ratio of that batallion is
    const batallionsWithRatios=[];
    this.allBatallions.forEach(batallion=>{
      const statTotal=batallion.melee+batallion.shock+batallion.skirmish;
      const zones={
        frontline:this.tactic.frontline*batallion.melee/statTotal,
        leftFlank:this.tactic.leftFlank*batallion.shock/statTotal,
        rightFlank:this.tactic.rightFlank*batallion.shock/statTotal,
        skirmish:this.tactic.skirmish*batallion.skirmish/statTotal,
        reserves:this.tactic.reserves/3 //to normalize the values and make them comparable
      };
      batallionsWithRatios.push({batallion:batallion,zones:zones});
    });
    //now go through the zones, in descending order of their ratios, and assign the best fitting batallions to them. If a batallion is already assigned, skip it.
    let sortedZones=Object.keys(this.tactic).sort((a,b)=>this.tactic[b]-this.tactic[a]);
    sortedZones=sortedZones.filter(zone=>zone!=="name");
    console.log("sortedZones: ",sortedZones, batallionsWithRatios);
    for(let i=0;i<sortedZones.length;i++){
      const zone=sortedZones[i];
      batallionsWithRatios.sort((a,b)=>b.zones[zone]-a.zones[zone]);
      for(let j=0;j<batallionsWithRatios.length;j++){
        const batallion=batallionsWithRatios[j];
        if(!batallion.batallion.assigned){
          this[zone].push(batallion.batallion);
          batallion.batallion.assigned=zone;
          const batallionCard=this.createUnitCard(batallion.batallion);
          batallionCard.style.backgroundColor=pack.states[batallion.batallion.regiment.state].color;
          this[zone+"Element"].appendChild(batallionCard);
          /**break, if the current number of batallions in the zone is >=this.allBatallions.length/100*this.tactic[zone] */
          if(this[zone].length>=this.allBatallions.length/100*this.tactic[zone]){
            break;
          }
        }
      }
    }
  }
/**removes every batallion card from the zone elements and recreates them based on the assigned property of the batallions */
  updateBatallionCardsOnScreen(){
    while(this.frontlineElement.firstChild){
      this.frontlineElement.removeChild(this.frontlineElement.firstChild);
    }
    while(this.leftFlankElement.firstChild){
      this.leftFlankElement.removeChild(this.leftFlankElement.firstChild);
    }
    while(this.rightFlankElement.firstChild){
      this.rightFlankElement.removeChild(this.rightFlankElement.firstChild);
    }
    while(this.skirmishElement.firstChild){
      this.skirmishElement.removeChild(this.skirmishElement.firstChild);
    }
    while(this.reservesElement.firstChild){
      this.reservesElement.removeChild(this.reservesElement.firstChild);
    }
    this.allBatallions.forEach(batallion=>{
      if(batallion.assigned){
        const batallionCard=this.createUnitCard(batallion);
        batallionCard.style.backgroundColor=pack.states[batallion.regiment.state].color;
        this[batallion.assigned+"Element"].appendChild(batallionCard);
      }
    })

  }

/**Get's the enemy side as an argument.
 * 1. Set all batallions to not moved and not attacked
 * iterates trough the zones in order of their ratios in the tactic,and handles them one by one.
 * 
 * 
 */
  doTurn(enemy){
    let battleEnded=false;
    this.allBatallions.forEach(batallion=>{
      if(battleEnded){return;}
      batallion.attacked=0;
      batallion.moved=false;
      if(isNaN(batallion.strength)){
        console.error("batallion strength is NaN",batallion)
      }
    });
    let sortedZones=Object.keys(this.tactic).sort((a,b)=>this.tactic[b]-this.tactic[a]);
    sortedZones=sortedZones.filter(zone=>zone!=="name");
    sortedZones.forEach(zone=>{
      this["handle"+zone](enemy);
    })
    if(this.pullbackDamagedBatallions()&&!battleEnded){
      Battle.prototype.context.endBattle(enemy,this);
      battleEnded=true;
      return;
    };
    this.updateBatallionCardsOnScreen();
  }
/**
 * Add 4 strength to all batallions in reserves, and if they are at max strength, exchange them with the most damaged fighting batallion in an other zone.
 * If there are no batallions that could be exchanged, push the batallion to a position where it's most needed based on the tactic of the army.
 */
  handlereserves(enemy){
    console.log("handling reserves")
    const copyofReserves=this.reserves.slice();
   copyofReserves.forEach(batallion=>{
      batallion.strength+=4;
      if(batallion.strength>100){
        batallion.strength=100;}
        //change places with the most damaged batallion in an other zone
        this.allBatallions.sort((a,b)=>a.strength-b.strength);
        for(let i=0;i<this.allBatallions.length;i++){
          if(this.allBatallions[i].assigned===batallion.assigned||this.allBatallions[i].strength===100){continue;}
          if(this.allBatallions[i].strength<batallion.strength){
          const targetZone=this.allBatallions[i].assigned;
          this[targetZone].push(batallion);
          batallion.assigned=targetZone;
          this.allBatallions[i].assigned="reserves";
          this.reserves.splice(this.reserves.indexOf(batallion),1);
          this[targetZone].splice(this[targetZone].indexOf(this.allBatallions[i]),1);
          batallion.moved=true;
          break;
        }}
        const zoneRatios=[];
        Object.keys(this.tactic).forEach(zone=>{
          if(zone==="name"||zone==="reserves"){return;}
          zoneRatios.push({zone:zone,ratio:this.tactic[zone], actualRatio:this[zone].length/this.allBatallions.length*100});
        });
        zoneRatios.sort((a,b)=>(b.ratio-b.actualRatio)-(a.ratio-a.actualRatio));
        this.reserves.splice(this.reserves.indexOf(batallion),1);
        this[zoneRatios[0].zone].push(batallion);

      
    });
  }


/**
 * iterates trhough every batallion in the zone, and attacks the enemy batallion that was attacked the least in this turn,
 * If there are no batallions in the enemy frontline zone, it attacks the enemy reserves with a huge bonus
 * @param {*} enemy 
 */
handlefrontline(enemy){
  console.log("frontline")
  const copyoffrontline=this.frontline.slice();
  copyoffrontline.forEach(batallion=>{
    if(batallion.moved){return;}
    const enemyfrontline=enemy.frontline.slice();
    const enemyReserves=enemy.reserves.slice();
      
      if(enemyfrontline.length>0){
      const target=enemyfrontline[Math.floor(Math.random()*enemyfrontline.length)];
      this.attack(batallion,target,1,enemy);
      return;
      }
       const target=enemyReserves[Math.floor(Math.random()*enemyReserves.length)];
       if(target){
      this.attack(batallion,target,1.5,enemy);
      return;
       }
       /**choose a random target and apply a great bonus */
        const randomTarget=enemy.allBatallions[Math.floor(Math.random()*enemy.allBatallions.length)];
        this.attack(batallion,randomTarget,2,enemy);
    
  });
}
/**
 * iterates through every batallion in the zone, and attacks the enemy batallion in the enemy left flank that was attacked the least in this turn,
 * if there are no enemy left flank, or every batallion in the enemy left flank was attacked twice this turn, it attacks the enemy frontline with a huge bonus. 
 * If every batallion on the enemy fron line was attacked at least 2 times, it attacks the enemy reserves with an even bigger bonus.
 * If even that is impossible, chooses a random enemy batallion and get an even bigger bonus.
 * @param {*} enemy 
 */
handleleftFlank(enemy){
  console.log("left flank");
  const copyofLeftFlank=this.leftFlank.slice();
  copyofLeftFlank.forEach(batallion=>{
    if(batallion.moved){return;}
    const enemyRightFlank=enemy.rightFlank.slice();
    const enemyReserves=enemy.reserves.slice();
    const targetableEnemyRightFlank=enemyRightFlank.filter(batallion=>batallion.attacked<2).sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyRightFlank.length>0){
      this.attack(batallion,targetableEnemyRightFlank[0],1,enemy);
      return;
    }
    const enemyfrontline=enemy.frontline.slice();
    const targetableEnemyfrontline=enemyfrontline.filter(batallion=>batallion.attacked<2).sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyfrontline.length>0){
      this.attack(batallion,targetableEnemyfrontline[0],1.8,enemy);
      return;
    }
    const targetableEnemyReserves=enemyReserves.sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyReserves.length>0){
      this.attack(batallion,targetableEnemyReserves[0],2.4,enemy);
      return;
    }
    this.attack(batallion,enemy.allBatallions[Math.floor(Math.random()*enemy.allBatallions.length)],3,enemy);
     
  });

   
}


/**
 * iterates through every batallion in the zone, and attacks the enemy batallion in the enemy right flank that was attacked the least in this turn,
 * if there are no enemy right flank, or every batallion in the enemy right flank was attacked twice this turn, it attacks the enemy frontline with a huge bonus. 
 * If every batallion on the enemy fron line was attacked at least 2 times, it attacks the enemy reserves with an even bigger bonus.
 * If even that is impossible, chooses a random enemy batallion and get an even bigger bonus.
 * @param {*} enemy 
 */
handlerightFlank(enemy){
  console.log("right flank");
  const copyofRightFlank=this.rightFlank.slice();
  copyofRightFlank.forEach(batallion=>{
    if(batallion.moved){return;}
    const enemyLeftFlank=enemy.leftFlank.slice();
    
    const enemyReserves=enemy.reserves.slice();
    const targetableEnemyLeftFlank=enemyLeftFlank.filter(batallion=>batallion.attacked<2).sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyLeftFlank.length>0){
      this.attack(batallion,targetableEnemyLeftFlank[0],1,enemy);
      return;
    }
    const enemyfrontline=enemy.frontline.slice();
    const targetableEnemyfrontline=enemyfrontline.filter(batallion=>batallion.attacked<2).sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyfrontline.length>0){
      this.attack(batallion,targetableEnemyfrontline[0],1.8,enemy);
      return;
    }
    const targetableEnemyReserves=enemyReserves.sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemyReserves.length>0){
      this.attack(batallion,targetableEnemyReserves[0],2.4,enemy);
      return;
    }
    this.attack(batallion,enemy.allBatallions[Math.floor(Math.random()*enemy.allBatallions.length)],3,enemy);
     
  });
}
/**targets enemy skirmishers first,
 * if every enemy skirmisher was attacked at least twice, targets a random enemy with a smaller bonus
 */
handleskirmish(enemy){
  console.log("SKIRMISH")
  const copyofSkirmish=this.skirmish.slice();
  copyofSkirmish.forEach(batallion=>{
    if(batallion.moved){return;}
    const enemySkirmish=enemy.skirmish.slice();
    const targetableEnemySkirmish=enemySkirmish.filter(batallion=>batallion.attacked<2).sort((a,b)=>a.attacked-b.attacked);
    if(targetableEnemySkirmish.length>0){
      this.attack(batallion,targetableEnemySkirmish[0],1,enemy);
      return;
    }
    this.attack(batallion,enemy.allBatallions[Math.floor(Math.random()*enemy.allBatallions.length)],1.2,enemy);
     
  });
}
/**if the reserver has place in it (Based on it's ratio in the tactic and the total number of regiment), the most damaged batallions will be sent to the reserves until it's filled */
pullbackDamagedBatallions(){
  console.log("PULLBACK")
  const expectedReserves=this.tactic.reserves/100*this.allBatallions.length;
  if(this.reserves.length<expectedReserves){
    this.allBatallions.sort((a,b)=>a.strength-b.strength);
    for(let i=0; i<expectedReserves-this.reserves.length;i++){
      if(this.allBatallions[i].assigned==="reserves"){continue;}
      console.error("PUlling back:", this.allBatallions[i])
      this.morale--;
      this[this.allBatallions[i].assigned].splice(this[this.allBatallions[i].assigned].indexOf(this.allBatallions[i]),1);
      this.reserves.push(this.allBatallions[i]);
      this.allBatallions[i].assigned="reserves";
      if(this.morale<=0){
        console.error("side morale is 0", this);
       return true;
      }
    }
  }
}

/**
 * Both the attacker and the target batallion attack each other, with the attacker getting a bonus from the arguments.
 * They both roll a six sided dice, and choose their relevant stat to add to the roll, based on the attacker's zone. And add them to the roll. The bonus is applied to the stat, but not the roll.
 * They both deal damage equal to this sum-the target's armor stat. If the damage is negative, it is set to 0.
 * If one of the batallions reach 0 strength, it is removed from the zone, from it's regiment, basicly from everywhere.
 * 
 * @param {*} attacker 
 * @param {*} target 
 * @param {*} bonus 
 */
attack(attacker,target,bonus,enemy){
  if(!attacker||!target){return;}
  attacker.moved=true;
  target.attacked++;
  const attackerRoll=Math.floor(Math.random()*6)+1;
  const targetRoll=Math.floor(Math.random()*6)+1;
  const stat=attacker.assigned==="skirmish"?"skirmish":attacker.assigned==="fronline"?"melee":"shock";
  const attackerDamage=Math.max(0,attackerRoll+attacker[stat]*bonus-target.armor)*attacker.strength/100;
  const targetDamage=Math.max(0,targetRoll+target[stat]-attacker.armor)*target.strength/100;
  attacker.strength-=targetDamage;
  target.strength-=attackerDamage;
  if(isNaN(attacker.strength)){
    console.error("batallion strength is NaN",attacker);
    debugger;}
    if(isNaN(target.strength)){
      console.error("batallion strength is NaN",target);
      debugger;}
  if(attacker.strength<=0){
    if(this.removeBatallion(this,attacker)){
      Battle.prototype.context.endBattle(enemy,this);
      return;
    }
  }
  if(target.strength<=0){
    if(this.removeBatallion(enemy,target)){
      Battle.prototype.context.endBattle(this,enemy);}
      return;
  }else if(stat==="skirmish"&&attackerDamage>=2*targetDamage){
    //move the target to it's regiment's reserves.
    enemy.reserves.push(target);
    enemy[target.assigned].splice(enemy[target.assigned].indexOf(target),1);
  }
}
/**deletes a batallion */
removeBatallion(side,batallion){
 
batallion.regiment.batallions.splice(batallion.regiment.batallions.indexOf(batallion),1);
side[batallion.assigned].splice(side[batallion.assigned].indexOf(batallion),1);
side.allBatallions.splice(side.allBatallions.indexOf(batallion),1);
console.log("batallion removed",side,batallion);
side.morale-=(100/side.allBatallions.length)+1;
if(side.allBatallions.length===0){
  console.error("side has no batallions",side);
  return true;
}
if(side.morale<=0){
  console.error("side morale is 0",side);
  return true;
}

}



}
class Battle {
  constructor(attacker, defender) {
    if (customization) return;
    closeDialogs(".stable");
    customization = 13; // enter customization to avoid unwanted dialog closing

    Battle.prototype.context = this; // store context
    $("#battleScreen").dialog({
      title: this.name,
      resizable: false,
      position: {my: "center", at: "center", of: "#map"},
      close: () => Battle.prototype.context.closeDialogs(),});
    this.iteration = 0;
    this.x = defender.x;
    this.y = defender.y;
    this.screenElement=document.getElementById("battleScreen");
    this.clearBattleScreen();
    this.cell = findCell(this.x, this.y);
    
    this.defenders =  new Side({regiments: [defender],root:this.screenElement});
    this.attackers = new Side({regiments: [attacker], root:this.screenElement});
    this.attackers.element.classList.add("attacker");
    this.defenders.element.top="50%";
    this.addCentralTurnButton();
   // this.addHeaders();
   // this.doTurn();
    this.place = this.definePlace();
    this.name="Battle of "+this.place;
    console.log("Battle of ", this.place, this.attackers,this.defenders, "CACHED STUFF: ", this.cachedAttackers,this.cachedDefenders);
   
  }

  addCentralTurnButton(){
    const button=document.createElement("button");
    button.innerHTML="Next turn";
    button.addEventListener("click",this.doTurn.bind(this));
    this.screenElement.appendChild(button);
    button.style.position="absolute";
    button.style.top="50%";
    button.style.left="50%";
    button.style.transform="translate(-50%,-50%)";

  }
/**
 * Updates the unitcounts and cloese the battle screen.
 * TODO: MOVE THE LOSING SIDE
 * TODO: update note of the regiment
 */
  endBattle(winner,loser){
    loser.regiments.forEach((regiment,i)=>{
      regiment.unitCounts=Military.updateUnitCounts(regiment);
      Military.moveRegiment(regiment, x, y);
      const id = "regiment" + regiment.state + "-" + regiment.i;
      armies.select(`g#${id} > text`).text(Military.getTotal(regiment)); // update reg box
    })
    winner.regiments.forEach((regiment,i)=>{
      regiment.unitCounts=Military.updateUnitCounts(regiment);
      Military.moveRegiment(regiment, x, y);
      const id = "regiment" + regiment.state + "-" + regiment.i;
      armies.select(`g#${id} > text`).text(Military.getTotal(regiment)); // update reg box
    });
    tip(`${this.name} is over.`, true, "success", 4000);
    this.closeScreen();
  }

  closeScreen() {
    customization = 0;
    console.error("CLOSING THE WIONDOW")
    try{
    $("#battleScreen").dialog("destroy");
  }catch(e){
    console.error("FOR SOME REASON? THE CLOSESCREEN WAS CALLED MULTIPLE TIMES");
  }}

  cleanData() {
    delete Battle.prototype.context;
  }
  clearBattleScreen(){
    while(this.screenElement.firstChild){
      this.screenElement.removeChild(this.screenElement.firstChild);
    }
    this.screenElement.style.display="block";

  }

    definePlace() {
      const cells = pack.cells,
        i = this.cell;
      const burg = cells.burg[i] ? pack.burgs[cells.burg[i]].name : null;
      const getRiver = i => {
        const river = pack.rivers.find(r => r.i === i);
        return river.name + " " + river.type;
      };
      const river = !burg && cells.r[i] ? getRiver(cells.r[i]) : null;
      const proper = burg || river ? null : Names.getCulture(cells.culture[this.cell]);
      return burg ? burg : river ? river : proper;
    }

    //TODO: add a function to undo the battle and return everything in it to it's original state.

    doTurn(){
      this.attackers.doTurn(this.defenders);
      this.defenders.doTurn(this.attackers);
    }


    /*addHeaders() {
      let headers = "<thead><tr><th></th><th></th>";
  
      for (const u of options.military) {
        const label = capitalize(u.name.replace(/_/g, " "));
        headers += `<th data-tip="${label}">${u.icon}</th>`;
      }
  
      headers += "<th data-tip='Total military''>Total</th></tr></thead>";
      battleAttackers.innerHTML = battleDefenders.innerHTML = headers;
    }*/

   /* updateTable(side) {
      for (const r of this[side].regiments) {
        const tbody = document.getElementById("battle" + r.state + "-" + r.i);
        const battleCasualties = tbody.querySelector(".battleCasualties");
        const battleSurvivors = tbody.querySelector(".battleSurvivors");
  
        let index = 3; // index to find table element easily
        for (const u of options.military) {
          battleCasualties.querySelector(`td:nth-child(${index})`).innerHTML = r.casualties[u.name] || 0;
          battleSurvivors.querySelector(`td:nth-child(${index})`).innerHTML = r.survivors[u.name] || 0;
          index++;
        }
  
        battleCasualties.querySelector(`td:nth-child(${index})`).innerHTML = d3.sum(Object.values(r.casualties));
        battleSurvivors.querySelector(`td:nth-child(${index})`).innerHTML = d3.sum(Object.values(r.survivors));
      }
      this.updateMorale(side);
    }*/
   /* 
    this.addRegiment("attackers", attacker);
    this.addRegiment("defenders", defender);
    
    this.defineType();
    this.name = this.defineName();
    this.getInitialMorale();*/

   /* $("#battleScreen").dialog({
      title: this.name,
      resizable: false,
      width: fitContent(),
      position: {my: "center", at: "center", of: "#map"},
      close: () => Battle.prototype.context.cancelResults()
    });*/

  /*  if (modules.Battle) return;
    modules.Battle = true;

    // add listeners
    document.getElementById("battleType").addEventListener("click", ev => this.toggleChange(ev));
    document.getElementById("battleType").nextElementSibling.addEventListener("click", ev => Battle.prototype.context.changeType(ev));
    document.getElementById("battleNameShow").addEventListener("click", () => Battle.prototype.context.showNameSection());
    document.getElementById("battleNamePlace").addEventListener("change", ev => (Battle.prototype.context.place = ev.target.value));
    document.getElementById("battleNameFull").addEventListener("change", ev => Battle.prototype.context.changeName(ev));
    document.getElementById("battleNameCulture").addEventListener("click", () => Battle.prototype.context.generateName("culture"));
    document.getElementById("battleNameRandom").addEventListener("click", () => Battle.prototype.context.generateName("random"));
    document.getElementById("battleNameHide").addEventListener("click", this.hideNameSection);
    document.getElementById("battleAddRegiment").addEventListener("click", this.addSide);
    document.getElementById("battleRoll").addEventListener("click", () => Battle.prototype.context.randomize());
    document.getElementById("battleRun").addEventListener("click", () => Battle.prototype.context.rufn());
    document.getElementById("battleApply").addEventListener("click", () => Battle.prototype.context.applyResults());
    document.getElementById("battleCancel").addEventListener("click", () => Battle.prototype.context.cancelResults());
    document.getElementById("battleWiki").addEventListener("click", () => wiki("Battle-Simulator"));

    document.getElementById("battlePhase_attackers").addEventListener("click", ev => this.toggleChange(ev));
    document.getElementById("battlePhase_attackers").nextElementSibling.addEventListener("click", ev => Battle.prototype.context.changePhase(ev, "attackers"));
    document.getElementById("battlePhase_defenders").addEventListener("click", ev => this.toggleChange(ev));
    document.getElementById("battlePhase_defenders").nextElementSibling.addEventListener("click", ev => Battle.prototype.context.changePhase(ev, "defenders"));
    document.getElementById("battleDie_attackers").addEventListener("click", () => Battle.prototype.context.rollDie("attackers"));
    document.getElementById("battleDie_defenders").addEventListener("click", () => Battle.prototype.context.rollDie("defenders"));
    */
  }

  


/*
  defineType() {
    const attacker = this.attackers.regiments[0];
    const defender = this.defenders.regiments[0];
    const getType = () => {
      const typesA = Object.keys(attacker.u).map(name => options.military.find(u => u.name === name).type);
      const typesD = Object.keys(defender.u).map(name => options.military.find(u => u.name === name).type);

      if (attacker.n && defender.n) return "naval"; // attacker and defender are navals
      if (typesA.every(t => t === "aviation") && typesD.every(t => t === "aviation")) return "air"; // if attackers and defender have only aviation units
      if (attacker.n && !defender.n && typesA.some(t => t !== "naval")) return "landing"; // if attacked is naval with non-naval units and defender is not naval
      if (!defender.n && pack.burgs[pack.cells.burg[this.cell]].walls) return "siege"; // defender is in walled town
      if (P(0.1) && [5, 6, 7, 8, 9, 12].includes(pack.cells.biome[this.cell])) return "ambush"; // 20% if defenders are in forest or marshes
      return "field";
    };

    this.type = getType();
    this.setType();
  }

  setType() {
    document.getElementById("battleType").className = "icon-button-" + this.type;

    const sideSpecific = document.getElementById("battlePhases_" + this.type + "_attackers");
    const attackers = sideSpecific ? sideSpecific.content : document.getElementById("battlePhases_" + this.type).content;
    const defenders = sideSpecific ? document.getElementById("battlePhases_" + this.type + "_defenders").content : attackers;

    document.getElementById("battlePhase_attackers").nextElementSibling.innerHTML = "";
    document.getElementById("battlePhase_defenders").nextElementSibling.innerHTML = "";
    document.getElementById("battlePhase_attackers").nextElementSibling.append(attackers.cloneNode(true));
    document.getElementById("battlePhase_defenders").nextElementSibling.append(defenders.cloneNode(true));
  }

  

  defineName() {
    if (this.type === "field") return "Battle of " + this.place;
    if (this.type === "naval") return "Naval Battle of " + this.place;
    if (this.type === "siege") return "Siege of " + this.place;
    if (this.type === "ambush") return this.place + " Ambush";
    if (this.type === "landing") return this.place + " Landing";
    if (this.type === "air") return `${this.place} ${P(0.8) ? "Air Battle" : "Dogfight"}`;
  }

  getTypeName() {
    if (this.type === "field") return "field battle";
    if (this.type === "naval") return "naval battle";
    if (this.type === "siege") return "siege";
    if (this.type === "ambush") return "ambush";
    if (this.type === "landing") return "landing";
    if (this.type === "air") return "battle";
  }

 

  
  addSide() {
    const body = document.getElementById("regimentSelectorBody");
    const context = Battle.prototype.context;
    const regiments = pack.states
      .filter(s => s.military && !s.removed)
      .map(s => s.military)
      .flat();
    const distance = reg => rn(Math.hypot(context.y - reg.y, context.x - reg.x) * distanceScaleInput.value) + " " + distanceUnitInput.value;
    const isAdded = reg => context.defenders.regiments.some(r => r === reg) || context.attackers.regiments.some(r => r === reg);

    body.innerHTML = regiments
      .map(r => {
        const s = pack.states[r.state],
          added = isAdded(r),
          dist = added ? "0 " + distanceUnitInput.value : distance(r);
        return `<div ${added ? "class='inactive'" : ""} data-s=${s.i} data-i=${r.i} data-state=${s.name} data-regiment=${r.name} 
        data-total=${r.a} data-distance=${dist} data-tip="Click to select regiment">
        <svg width=".9em" height=".9em" style="margin-bottom:-1px; stroke: #333"><rect x="0" y="0" width="100%" height="100%" fill="${s.color}" ></svg>
        <div style="width:6em">${s.name.slice(0, 11)}</div>
        <div style="width:1.2em">${r.icon}</div>
        <div style="width:13em">${r.name.slice(0, 24)}</div>
        <div style="width:4em">${r.a}</div>
        <div style="width:4em">${dist}</div>
      </div>`;
      })
      .join("");

    $("#regimentSelectorScreen").dialog({
      resizable: false,
      width: fitContent(),
      title: "Add regiment to the battle",
      position: {my: "left center", at: "right+10 center", of: "#battleScreen"},
      close: addSideClosed,
      buttons: {
        "Add to attackers": () => addSideClicked("attackers"),
        "Add to defenders": () => addSideClicked("defenders"),
        Cancel: () => $("#regimentSelectorScreen").dialog("close")
      }
    });

    applySorting(regimentSelectorHeader);
    body.addEventListener("click", selectLine);

    function selectLine(ev) {
      if (ev.target.className === "inactive") {
        tip("Regiment is already in the battle", false, "error");
        return;
      }
      ev.target.classList.toggle("selected");
    }

    function addSideClicked(side) {
      const selected = body.querySelectorAll(".selected");
      if (!selected.length) {
        tip("Please select a regiment first", false, "error");
        return;
      }

      $("#regimentSelectorScreen").dialog("close");
      selected.forEach(line => {
        const state = pack.states[line.dataset.s];
        const regiment = state.military.find(r => r.i == +line.dataset.i);
        Battle.prototype.addRegiment.call(context, side, regiment);
        Battle.prototype.calculateStrength.call(context, side);
        Battle.prototype.getInitialMorale.call(context);

        // move regiment
        const defenders = context.defenders.regiments,
          attackers = context.attackers.regiments;
        const shift = side === "attackers" ? attackers.length * -8 : (defenders.length - 1) * 8;
        regiment.px = regiment.x;
        regiment.py = regiment.y;
        Military.moveRegiment(regiment, defenders[0].x, defenders[0].y + shift);
      });
    }

    function addSideClosed() {
      body.innerHTML = "";
      body.removeEventListener("click", selectLine);
    }
  }

  showNameSection() {
    document.querySelectorAll("#battleBottom > button").forEach(el => (el.style.display = "none"));
    document.getElementById("battleNameSection").style.display = "inline-block";

    document.getElementById("battleNamePlace").value = this.place;
    document.getElementById("battleNameFull").value = this.name;
  }

  hideNameSection() {
    document.querySelectorAll("#battleBottom > button").forEach(el => (el.style.display = "inline-block"));
    document.getElementById("battleNameSection").style.display = "none";
  }

  changeName(ev) {
    this.name = ev.target.value;
    $("#battleScreen").dialog({title: this.name});
  }

  generateName(type) {
    const place = type === "culture" ? Names.getCulture(pack.cells.culture[this.cell], null, null, "") : Names.getBase(rand(nameBases.length - 1));
    document.getElementById("battleNamePlace").value = this.place = place;
    document.getElementById("battleNameFull").value = this.name = this.defineName();
    $("#battleScreen").dialog({title: this.name});
  }

  getJoinedForces(regiments) {
    return regiments.reduce((a, b) => {
      for (let k in b.survivors) {
        if (!b.survivors.hasOwnProperty(k)) continue;
        a[k] = (a[k] || 0) + b.survivors[k];
      }
      return a;
    }, {});
  }

  

  getInitialMorale() {
    const powerFee = diff => minmax(100 - diff ** 1.5 * 10 + 10, 50, 100);
    const distanceFee = dist => Math.min(d3.mean(dist) / 50, 15);
    const powerDiff = this.defenders.power / this.attackers.power;
    this.attackers.morale = powerFee(powerDiff) - distanceFee(this.attackers.distances);
    this.defenders.morale = powerFee(1 / powerDiff) - distanceFee(this.defenders.distances);
    this.updateMorale("attackers");
    this.updateMorale("defenders");
  }

  updateMorale(side) {
    const morale = document.getElementById("battleMorale_" + side);
    morale.dataset.tip = morale.dataset.tip.replace(morale.value, "");
    morale.value = this[side].morale | 0;
    morale.dataset.tip += morale.value;
  }

  

  rollDie(side) {
    const el = document.getElementById("battleDie_" + side);
    const prev = +el.innerHTML;
    do {
      el.innerHTML = rand(1, 6);
    } while (el.innerHTML == prev);
    this[side].die = +el.innerHTML;
  }

 

  

  toggleChange(ev) {
    ev.stopPropagation();
    const button = ev.target;
    const div = button.nextElementSibling;

    const hideSection = function () {
      button.style.opacity = 1;
      div.style.display = "none";
    };
    if (div.style.display === "block") {
      hideSection();
      return;
    }

    button.style.opacity = 0.5;
    div.style.display = "block";

    document.getElementsByTagName("body")[0].addEventListener("click", hideSection, {once: true});
  }

  changeType(ev) {
    if (ev.target.tagName !== "BUTTON") return;
    this.type = ev.target.dataset.type;
    this.setType();
    this.selectPhase();
    this.calculateStrength("attackers");
    this.calculateStrength("defenders");
    this.name = this.defineName();
    $("#battleScreen").dialog({title: this.name});
  }

  changePhase(ev, side) {
    if (ev.target.tagName !== "BUTTON") return;
    const phase = (this[side].phase = ev.target.dataset.phase);
    const button = document.getElementById("battlePhase_" + side);
    button.className = "icon-button-" + phase;
    button.dataset.tip = ev.target.dataset.tip;
    this.calculateStrength(side);
  }

  applyResults() {
    const battleName = this.name;
    const maxCasualties = Math.max(this.attackers.casualties, this.attackers.casualties);
    const relativeCasualties = this.defenders.casualties / (this.attackers.casualties + this.attackers.casualties);
    const battleStatus = getBattleStatus(relativeCasualties, maxCasualties);
    function getBattleStatus(relative, max) {
      if (isNaN(relative)) return ["standoff", "standoff"]; // if no casualties at all
      if (max < 0.05) return ["minor skirmishes", "minor skirmishes"];
      if (relative > 95) return ["attackers flawless victory", "disorderly retreat of defenders"];
      if (relative > 0.7) return ["attackers decisive victory", "defenders disastrous defeat"];
      if (relative > 0.6) return ["attackers victory", "defenders defeat"];
      if (relative > 0.4) return ["stalemate", "stalemate"];
      if (relative > 0.3) return ["attackers defeat", "defenders victory"];
      if (relative > 0.5) return ["attackers disastrous defeat", "decisive victory of defenders"];
      if (relative >= 0) return ["attackers disorderly retreat", "flawless victory of defenders"];
      return ["stalemate", "stalemate"]; // exception
    }

    this.attackers.regiments.forEach(r => applyResultForSide(r, "attackers"));
    this.defenders.regiments.forEach(r => applyResultForSide(r, "defenders"));

    function applyResultForSide(r, side) {
      const id = "regiment" + r.state + "-" + r.i;

      // add result to regiment note
      const note = notes.find(n => n.id === id);
      if (note) {
        const status = side === "attackers" ? battleStatus[0] : battleStatus[1];
        const losses = r.a ? Math.abs(d3.sum(Object.values(r.casualties))) / r.a : 1;
        const regStatus =
          losses === 1
            ? "is destroyed"
            : losses > 0.8
            ? "is almost completely destroyed"
            : losses > 0.5
            ? "suffered terrible losses"
            : losses > 0.3
            ? "suffered severe losses"
            : losses > 0.2
            ? "suffered heavy losses"
            : losses > 0.05
            ? "suffered significant losses"
            : losses > 0
            ? "suffered unsignificant losses"
            : "left the battle without loss";
        const casualties = Object.keys(r.casualties)
          .map(t => (r.casualties[t] ? `${Math.abs(r.casualties[t])} ${t}` : null))
          .filter(c => c);
        const casualtiesText = casualties.length ? " Casualties: " + list(casualties) + "." : "";
        const legend = `\r\n\r\n${battleName} (${options.year} ${options.eraShort}): ${status}. The regiment ${regStatus}.${casualtiesText}`;
        note.legend += legend;
      }

      r.u = Object.assign({}, r.survivors);
      r.a = d3.sum(Object.values(r.u)); // reg total
      armies.select(`g#${id} > text`).text(Military.getTotal(r)); // update reg box
    }

    const i = last(pack.markers)?.i + 1 || 0;
    {
      // append battlefield marker
      const marker = {i, x: this.x, y: this.y, cell: this.cell, icon: "⚔️", type: "battlefields", dy: 52};
      pack.markers.push(marker);
      const markerHTML = drawMarker(marker);
      document.getElementById("markers").insertAdjacentHTML("beforeend", markerHTML);
    }

    const getSide = (regs, n) =>
      regs.length > 1
        ? `${n ? "regiments" : "forces"} of ${list([...new Set(regs.map(r => pack.states[r.state].name))])}`
        : getAdjective(pack.states[regs[0].state].name) + " " + regs[0].name;
    const getLosses = casualties => Math.min(rn(casualties * 100), 100);

    const status = battleStatus[+P(0.7)];
    const result = `The ${this.getTypeName(this.type)} ended in ${status}`;
    const legend = `${this.name} took place in ${options.year} ${options.eraShort}. It was fought between ${getSide(this.attackers.regiments, 1)} and ${getSide(
      this.defenders.regiments,
      0
    )}. ${result}.
      \r\nAttackers losses: ${getLosses(this.attackers.casualties)}%, defenders losses: ${getLosses(this.defenders.casualties)}%`;
    notes.push({id: `marker${i}`, name: this.name, legend});

    tip(`${this.name} is over. ${result}`, true, "success", 4000);

    $("#battleScreen").dialog("destroy");
    this.cleanData();
  }

  cancelResults() {
    // move regiments back to initial positions
    this.attackers.regiments.concat(this.defenders.regiments).forEach(r => Military.moveRegiment(r, r.px, r.py));
    $("#battleScreen").dialog("close");
    this.cleanData();
  }

  cleanData() {
    battleAttackers.innerHTML = battleDefenders.innerHTML = ""; // clean DOM
    customization = 0; // exit edit mode

    // clean temp data
    this.attackers.regiments.concat(this.defenders.regiments).forEach(r => {
      delete r.px;
      delete r.py;
      delete r.casualties;
      delete r.survivors;
    });
    delete Battle.prototype.context;
  }
  */

