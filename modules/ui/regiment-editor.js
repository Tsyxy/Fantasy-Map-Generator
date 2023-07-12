"use strict";
function editRegiment(selector) {
  if (customization) return;
  closeDialogs(".stable");
  if (!layerIsOn("toggleMilitary")) toggleMilitary();

  armies.selectAll(":scope > g").classed("draggable", true);
  armies.selectAll(":scope > g > g").call(d3.drag().on("drag", dragRegiment));
  elSelected = selector ? document.querySelector(selector) : d3.event.target.parentElement; // select g element
  if (!pack.states[elSelected.dataset.state]) return;
  if (!regiment()) return;
  updateRegimentData(regiment());
  drawBase();

  $("#regimentEditor").dialog({
    title: "Edit Regiment",
    resizable: false,
    close: closeEditor,
    position: {my: "left top", at: "left+10 top+10", of: "#map"}
  });

  if (modules.editRegiment) return;
  modules.editRegiment = true;
// get regiment data element
function regiment() {
  return pack.states[elSelected.dataset.state].military.find(r => r.i == elSelected.dataset.id);
}
  // add listeners
  document.getElementById("regimentNameRestore").addEventListener("click", restoreName);
  document.getElementById("regimentType").addEventListener("click", changeType);
  document.getElementById("regimentName").addEventListener("change", changeName);
  document.getElementById("regimentEmblem").addEventListener("input", changeEmblem);
  document.getElementById("regimentEmblemSelect").addEventListener("click", selectEmblem);
  document.getElementById("regimentAttack").addEventListener("click", toggleAttack);
  document.getElementById("regimentRegenerateLegend").addEventListener("click", regenerateLegend);
  document.getElementById("regimentLegend").addEventListener("click", editLegend);
  document.getElementById("regimentSplit").addEventListener("click", splitRegimentTsyxy);
  document.getElementById("regimentAdd").addEventListener("click", toggleAdd);
  document.getElementById("regimentAttach").addEventListener("click", toggleAttach);
  document.getElementById("regimentRemove").addEventListener("click", removeRegiment);

  
  function distance(a,b){
    return (a.x-b.x)**2+(a.y-b.y)**2;
  }
  function updateRegimentData(regiment) {
    document.getElementById("regimentType").className = regiment.n ? "icon-anchor" : "icon-users";
    document.getElementById("regimentName").value = regiment.name;
    document.getElementById("regimentEmblem").value = regiment.icon;
    const composition = document.getElementById("regimentComposition");
    createBatallionAdderInput(regiment);
    updateLocationOfRegimentElement(regiment);
    createBatallionCards(regiment);
    updateComposition(regiment);

    composition.querySelectorAll("input").forEach(el => el.addEventListener("change", changeUnit));
    

  }

  function updateComposition(regiment) {
    const composition = document.getElementById("regimentComposition");
    composition.innerHTML = options.military
      .map(u => {
        if(!regiment.unitCounts[u.name]) return "";
        return `<div class="batallionName" data-tip="${capitalize(u.name)}">
      <div style="display:table-cell"> ${regiment.unitCounts[u.name]} batallions of ${capitalize(u.name)}</div>
       </div>`;
      })
      .join("");
  }

  function createBatallionAdderInput(regiment){
    const card=document.getElementById("batallionAdder");
    while(card.firstChild) card.removeChild(card.firstChild);
    const unitSelector=document.createElement("select");
    unitSelector.innerHTML=options.military.map(u=>`<option value="${u.name}">${capitalize(u.name)}</option>`).join("");
    const cultureSelector=document.createElement("select");
    cultureSelector.innerHTML=pack.cultures.map(c=>`<option value="${c.i}">${c.name}</option>`).join("");
    const count=document.createElement("input");
    count.type="number";
    const button=document.createElement("button");
    button.innerHTML="Add Batallion(s)";
    button.onclick=(()=>{
      console.log(unitSelector.value,count.value,regiment);
      for(let i=0;i<count.value;i++){
        addBatallion(options.military.find(u=>u.name===unitSelector.value),regiment,cultureSelector.value);
      }
      createBatallionCards(regiment);
      updateComposition(regiment);
      Military.drawRegiment(regiment,regiment.state);

    });
    card.appendChild(cultureSelector);
    card.appendChild(unitSelector);
    card.appendChild(count);
    card.appendChild(button);
  }

  function updateLocationOfRegimentElement(regiment){
    const burg=getClosestBurg(regiment);
    const element=document.getElementById("regimentLocation");
    element.innerHTML=`<div>Stationed near ${burg}</div>`;
  }

  function getClosestBurg(regiment){
    const burgs=pack.burgs.filter(b=>pack.cells.state[b.cell]===regiment.state);
    let closestBurg=burgs[0];
    let closestDistance=distance(regiment.x,regiment.y,burgs[0].x,burgs[0].y);
    burgs.forEach(burg=>{
      const dist=distance(regiment.x,regiment.y,burg.x,burg.y);
      if(dist<closestDistance){
        closestBurg=burg;
        closestDistance=dist;
      }
    });
    return closestBurg.name;
  }


  function createBatallionCards(regiment) {
    const cards = document.getElementById("regimentBatallionList");
    while(cards.firstChild) cards.removeChild(cards.firstChild);
    regiment.batallions.forEach(batallion => {
      //in the first row it should have the name of the batallion, in the second row, it should have it's strength, skirmish, schock, melee and armour stats
      const card = document.createElement("div");
      card.classList.add("batallionCard");
      card.innerHTML = `<div class="batallionName">${batallion.icon}${batallion.name}</div><div class="batallionStats">❤️: ${batallion.strength} 🏹: ${batallion.skirmish} 🐴: ${batallion.shock} ⚔️: ${batallion.melee} 🛡️: ${batallion.armor}  🙏: ${pack.religions[batallion.religionID].name}</div>`;
      cards.appendChild(card);
    });
  }

  function addBatallion(unit,regiment,cultureInput){
    
    const culture=pack.cultures[cultureInput];
    console.error("addBatallion",unit,regiment, cultureInput,pack.cultures,culture);
    const religion=regiment.batallions.length?regiment.batallions[0].religionID:pack.cells.religion[regiment.cell];
    const batallion={
      cell: regiment.cell,
      strength:100, 
      x:regiment.x, 
      y:regiment.y, 
      unit: unit.name,
      naval:regiment.n, 
      separate: unit.separate, 
      type: unit.type,
      cultureID:culture.i,
      religionID:religion,
      inRegiment:true,
      icon:unit.icon,
      skirmish:unit.skirmish,
      melee:unit.melee,
      shock:unit.shock,
      armor:unit.armor,
      name:nameNewBatallion(unit,regiment,culture.i),
      regiment:regiment
    }
    regiment.batallions.push(batallion);
    if(!regiment.unitCounts[unit.name]) {regiment.unitCounts[unit.name]=0;}
    regiment.unitCounts[unit.name]+=1;
    
  }

  function nameNewBatallion(unit,regiment,cultureID){
    const province=pack.provinces[pack.cells.province[regiment.cell]];
    const cultureName=pack.cultures[cultureID].name;
    const provinceName=province.name;
    const id=province.unitCounts[unit.name]+1;
    province.unitCounts[unit.name]+=1;
    const name=id+'. '+cultureName+" "+unit.name +" batallion of "+provinceName;
    return name;
  }


  function drawBase() {
    const reg = regiment();
    const clr = pack.states[elSelected.dataset.state].color;
    const base = viewbox
      .insert("g", "g#armies")
      .attr("id", "regimentBase")
      .attr("stroke-width", 0.3)
      .attr("stroke", "#000")
      .attr("cursor", "move");
    base
      .on("mouseenter", () => {
        tip("Regiment base. Drag to re-base the regiment", true);
      })
      .on("mouseleave", () => {
        tip("", true);
      });

    base
      .append("line")
      .attr("x1", reg.bx)
      .attr("y1", reg.by)
      .attr("x2", reg.x)
      .attr("y2", reg.y)
      .attr("class", "regimentDragLine");
    base
      .append("circle")
      .attr("cx", reg.bx)
      .attr("cy", reg.by)
      .attr("r", 2)
      .attr("fill", clr)
      .call(d3.drag().on("drag", dragBase));
  }

  function changeType() {
    const reg = regiment();
    reg.n = +!reg.n;
    document.getElementById("regimentType").className = reg.n ? "icon-anchor" : "icon-users";

    const size = +armies.attr("box-size");
    const baseRect = elSelected.querySelectorAll("rect")[0];
    const iconRect = elSelected.querySelectorAll("rect")[1];
    const icon = elSelected.querySelector(".regimentIcon");
    const x = reg.n ? reg.x - size * 2 : reg.x - size * 3;
    baseRect.setAttribute("x", x);
    baseRect.setAttribute("width", reg.n ? size * 4 : size * 6);
    iconRect.setAttribute("x", x - size * 2);
    icon.setAttribute("x", x - size);
    elSelected.querySelector("text").innerHTML = Military.getTotal(reg);
  }

  function changeName() {
    elSelected.dataset.name = regiment().name = this.value;
  }

  function restoreName() {
    const reg = regiment(),
      regs = pack.states[elSelected.dataset.state].military;
    const name = Military.getName(reg, regs);
    elSelected.dataset.name = reg.name = document.getElementById("regimentName").value = name;
  }

  function selectEmblem() {
    selectIcon(regimentEmblem.value, v => {
      regimentEmblem.value = v;
      changeEmblem();
    });
  }

  function changeEmblem() {
    const emblem = document.getElementById("regimentEmblem").value;
    regiment().icon = elSelected.querySelector(".regimentIcon").innerHTML = emblem;
  }

  function splitRegimentTsyxy(){
   
    const regiment=pack.states[elSelected.dataset.state].military.find(r => r.i == elSelected.dataset.id);
    if(regiment.batallions.length<2) {
      tip("Not enough forces to split", false, "error");
      return;}
  
    const military=pack.states[regiment.state].military;
      
    const newRegiment=Object.assign({},regiment);
    const oldRegiment=Object.assign({},regiment);
    newRegiment.batallions=[];
    oldRegiment.batallions=[];
    for(let i=0;i<regiment.batallions.length;i++){
      if(i%2==0){
    newRegiment.batallions.push(regiment.batallions[i]);
    continue;
    }
    oldRegiment.batallions.push(regiment.batallions[i]);
  }
  regiment.batallions=oldRegiment.batallions;
  regiment.unitCounts=getUnitCounts(regiment);
  newRegiment.unitCounts=getUnitCounts(newRegiment);
  newRegiment.i=pack.states[regiment.state].military.length;
  newRegiment.name=Military.getName(newRegiment, military);
  newRegiment.icon=Military.getEmblem(newRegiment);
  newRegiment.x+=5;
  newRegiment.y+=5;
  newRegiment.batallions.forEach(batallion=>batallion.regiment.i=newRegiment.i);
  military.push(newRegiment);
    Military.generateNote(newRegiment, pack.states[regiment.state]); // add legend
    Military.drawRegiment(newRegiment,regiment.state); // draw new reg below
    Military.drawRegiment(regiment,regiment.state); // redraw old
    if (regimentsOverviewRefresh.offsetParent) regimentsOverviewRefresh.click();
    createBatallionCards(regiment);
      updateComposition(regiment);
  }
  



  function getUnitCounts(regiment){
    const unitCounts={};
    options.military.forEach(unit=>{
      const batallions=regiment.batallions?.filter(batallion => batallion.unit === unit.name);
      unitCounts[unit.name]=batallions?.length||0;
    });
    return unitCounts;
  }


  function splitRegiment() {
    const reg = regiment(),
      u1 = reg.u;
    const state = +elSelected.dataset.state,
      military = pack.states[state].military;
    const i = last(military).i + 1,
      u2 = Object.assign({}, u1); // u clone

    Object.keys(u2).forEach(u => (u2[u] = Math.floor(u2[u] / 2))); // halved new reg
    const a = d3.sum(Object.values(u2)); // new reg total
    if (!a) {
      tip("Not enough forces to split", false, "error");
      return;
    } // nothing to add

    // update old regiment
    Object.keys(u1).forEach(u => (u1[u] = Math.ceil(u1[u] / 2))); // halved old reg
    reg.a = d3.sum(Object.values(u1)); // old reg total
    regimentComposition.querySelectorAll("input").forEach(el => (el.value = reg.u[el.dataset.u] || 0));
    elSelected.querySelector("text").innerHTML = Military.getTotal(reg);

    // create new regiment
    const shift = +armies.attr("box-size") * 2;
    const y = function (x, y) {
      do {
        y += shift;
      } while (military.find(r => r.x === x && r.y === y));
      return y;
    };
    const newReg={
            n:reg.n,
            cell:reg.cell,
            name: getName(reg, military),
            icon : getEmblem(reg),
            x:reg.x,
            y:reg.y,
            bx:reg.x,
            by:reg.y,
            batallions:reg.batallions,
            unitCounts:unitCounts
    }
    newReg.name = Military.getName(newReg, military);
    military.push(newReg);
    Military.generateNote(newReg, pack.states[state]); // add legend
    Military.drawRegiment(newReg, state); // draw new reg below

    if (regimentsOverviewRefresh.offsetParent) regimentsOverviewRefresh.click();
  }

  function toggleAdd() {
    document.getElementById("regimentAdd").classList.toggle("pressed");
    if (document.getElementById("regimentAdd").classList.contains("pressed")) {
      viewbox.style("cursor", "crosshair").on("click", addRegimentOnClick);
      tip("Click on map to create new regiment or fleet", true);
    } else {
      clearMainTip();
      viewbox.on("click", clicked).style("cursor", "default");
    }
  }

  function addRegimentOnClick() {
    const point = d3.mouse(this);
    const cell = findCell(point[0], point[1]);
    const x = pack.cells.p[cell][0],
      y = pack.cells.p[cell][1];
    const state = +elSelected.dataset.state,
      military = pack.states[state].military;
    const i = military.length ? last(military).i + 1 : 0;
    const n = +(pack.cells.h[cell] < 20); // naval or land
  const reg={
    n:n,
    cell:cell,
    icon:"🛡️",
    x:x,
    y:y,
    bx:x,
    by:y,
    state:state,
    i:i,
    batallions:[],
    unitCounts:{}
  }
  reg.name = Military.getName(reg, military);
    military.push(reg);
    Military.generateNote(reg, pack.states[state]); // add legend
    Military.drawRegiment(reg, state);
    
    if (regimentsOverviewRefresh.offsetParent) regimentsOverviewRefresh.click();
    toggleAdd();
  }

  function toggleAttack() {
    document.getElementById("regimentAttack").classList.toggle("pressed");
    if (document.getElementById("regimentAttack").classList.contains("pressed")) {
      viewbox.style("cursor", "crosshair").on("click", attackRegimentOnClick);
      tip("Click on another regiment to initiate battle", true);
      armies.selectAll(":scope > g").classed("draggable", false);
    } else {
      clearMainTip();
      armies.selectAll(":scope > g").classed("draggable", true);
      viewbox.on("click", clicked).style("cursor", "default");
    }
  }

  function attackRegimentOnClick() {
    const target = d3.event.target,
      regSelected = target.parentElement,
      army = regSelected.parentElement;
    const oldState = +elSelected.dataset.state,
      newState = +regSelected.dataset.state;

    if (army.parentElement.id !== "armies") {
      tip("Please click on a regiment to attack", false, "error");
      return;
    }
    if (regSelected === elSelected) {
      tip("Regiment cannot attack itself", false, "error");
      return;
    }
    if (oldState === newState) {
      tip("Cannot attack fraternal regiment", false, "error");
      return;
    }

    const attacker = regiment();
    const defender = pack.states[regSelected.dataset.state].military.find(r => r.i == regSelected.dataset.id);
    if (!attacker.batallions.length || !defender.batallions.length) {
      tip("Regiment has no troops to battle", false, "error");
      return;
    }

    // save initial position to temp attribute
    (attacker.px = attacker.x), (attacker.py = attacker.y);
    (defender.px = defender.x), (defender.py = defender.y);

    // move attacker to defender
    Military.moveRegiment(attacker, defender.x, defender.y - 8);

    // draw battle icon
    const attack = d3
      .transition()
      .delay(300)
      .duration(700)
      .ease(d3.easeSinInOut)
      .on("end", () => new Battle(attacker, defender));
    svg
      .append("text")
      .attr("x", window.innerWidth / 2)
      .attr("y", window.innerHeight / 2)
      .text("⚔️")
      .attr("font-size", 0)
      .attr("opacity", 1)
      .style("dominant-baseline", "central")
      .style("text-anchor", "middle")
      .transition(attack)
      .attr("font-size", 1000)
      .attr("opacity", 0.2)
      .remove();

    clearMainTip();
    $("#regimentEditor").dialog("close");
  }

  function toggleAttach() {
    document.getElementById("regimentAttach").classList.toggle("pressed");
    if (document.getElementById("regimentAttach").classList.contains("pressed")) {
      viewbox.style("cursor", "crosshair").on("click", attachRegimentOnClick);
      tip("Click on another regiment to unite both regiments. The current regiment will be removed", true);
      armies.selectAll(":scope > g").classed("draggable", false);
    } else {
      clearMainTip();
      armies.selectAll(":scope > g").classed("draggable", true);
      viewbox.on("click", clicked).style("cursor", "default");
    }
  }
  
  
  function attachRegimentOnClick() {
    const target = d3.event.target,
      regSelected = target.parentElement,
      army = regSelected.parentElement;
    const oldState = +elSelected.dataset.state,
      newState = +regSelected.dataset.state;

    if (army.parentElement.id !== "armies") {
      tip("Please click on a regiment", false, "error");
      return;
    }
    if (regSelected === elSelected) {
      tip("Cannot attach regiment to itself. Please click on another regiment", false, "error");
      return;
    }

    const attachedRegiment = regiment(); // reg to be attached
    const targetRegiment = pack.states[newState].military.find(r => r.i == regSelected.dataset.id); // reg to attach to

    attachedRegiment.batallions.forEach(batallion => {
      batalion.regiment = targetRegiment.i;
      targetRegiment.batallions.push(batallion);
    });
    
    for(const key in attachedRegiment.unitCounts){
      if(targetRegiment.unitCounts[key]){
        targetRegiment.unitCounts[key] += attachedRegiment.unitCounts[key];
      }else{
        targetRegiment.unitCounts[key] = attachedRegiment.unitCounts[key];
      }
    }

    
    regSelected.querySelector("text").innerHTML = Military.getTotal(targetRegiment); // update selected reg total text

    // remove attached regiment
    const military = pack.states[oldState].military;
    military.splice(military.indexOf(attachedRegiment), 1);
    const index = notes.findIndex(n => n.id === elSelected.id);
    if (index != -1) notes.splice(index, 1);
    elSelected.remove();

    if (regimentsOverviewRefresh.offsetParent) regimentsOverviewRefresh.click();
    $("#regimentEditor").dialog("close");
    editRegiment("#" + regSelected.id);
  }

  function regenerateLegend() {
    const index = notes.findIndex(n => n.id === elSelected.id);
    if (index != -1) notes.splice(index, 1);

    const s = pack.states[elSelected.dataset.state];
    Military.generateNote(regiment(), s);
  }

  function editLegend() {
    editNotes(elSelected.id, regiment().name);
  }

  function removeRegiment() {
    alertMessage.innerHTML = "Are you sure you want to remove the regiment?";
    $("#alert").dialog({
      resizable: false,
      title: "Remove regiment",
      buttons: {
        Remove: function () {
          $(this).dialog("close");
          const military = pack.states[elSelected.dataset.state].military;
          const regIndex = military.indexOf(regiment());
          if (regIndex === -1) return;
          military.splice(regIndex, 1);

          const index = notes.findIndex(n => n.id === elSelected.id);
          if (index != -1) notes.splice(index, 1);
          elSelected.remove();

          if (militaryOverviewRefresh.offsetParent) militaryOverviewRefresh.click();
          if (regimentsOverviewRefresh.offsetParent) regimentsOverviewRefresh.click();
          $("#regimentEditor").dialog("close");
        },
        Cancel: function () {
          $(this).dialog("close");
        }
      }
    });
  }

  function dragRegiment() {
    d3.select(this).raise();
    d3.select(this.parentNode).raise();

    const reg = pack.states[this.dataset.state].military.find(r => r.i == this.dataset.id);
    const size = +armies.attr("box-size");
    const w = reg.n ? size * 4 : size * 6;
    const h = size * 2;
    const x1 = x => rn(x - w / 2, 2);
    const y1 = y => rn(y - size, 2);

    const baseRect = this.querySelector("rect");
    const text = this.querySelector("text");
    const iconRect = this.querySelectorAll("rect")[1];
    const icon = this.querySelector(".regimentIcon");

    const self = elSelected === this;
    const baseLine = viewbox.select("g#regimentBase > line");

    d3.event.on("drag", function () {
      const x = (reg.x = d3.event.x),
        y = (reg.y = d3.event.y);

      baseRect.setAttribute("x", x1(x));
      baseRect.setAttribute("y", y1(y));
      text.setAttribute("x", x);
      text.setAttribute("y", y);
      iconRect.setAttribute("x", x1(x) - h);
      iconRect.setAttribute("y", y1(y));
      icon.setAttribute("x", x1(x) - size);
      icon.setAttribute("y", y);
      if (self) baseLine.attr("x2", x).attr("y2", y);
    });
  }

  function dragBase() {
    const baseLine = viewbox.select("g#regimentBase > line");
    const reg = regiment();

    d3.event.on("drag", function () {
      this.setAttribute("cx", d3.event.x);
      this.setAttribute("cy", d3.event.y);
      baseLine.attr("x1", d3.event.x).attr("y1", d3.event.y);
    });

    d3.event.on("end", function () {
      reg.bx = d3.event.x;
      reg.by = d3.event.y;
    });
  }

  function closeEditor() {
    armies.selectAll(":scope > g").classed("draggable", false);
    armies.selectAll("g>g").call(d3.drag().on("drag", null));
    viewbox.selectAll("g#regimentBase").remove();
    document.getElementById("regimentAdd").classList.remove("pressed");
    document.getElementById("regimentAttack").classList.remove("pressed");
    document.getElementById("regimentAttach").classList.remove("pressed");
    restoreDefaultEvents();
    elSelected = null;
  }
}
