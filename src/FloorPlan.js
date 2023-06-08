import React, { useEffect, useRef } from 'react';
import { FloorPlanEngine } from '@archilogic/floor-plan-sdk'
import './FloorPlan.css'

import {
  startupSettings,
  hexToRgb,
  arrayEquals,
} from './utils'

let spaceColorObjects = []

const productId = 'cd84b712-f29d-40a1-8d41-e756a2d5fc6e' //coffee machine

const colors = {
  green: '#21ff00',
  yellow: '#f1ff84',
  red: '#df9a9a'
}

let token
let floorId
let hasLoaded = false
let fpe

let prevMeetingData 
let prevCoffeeMachineData
let prevClickedMeetingRoomId

let meetingRooms

function isTimeInRange(timeRange, time) {
  const [start, end] = timeRange.split(' - ');
  
  const startTime = new Date(`1970-01-01T${start}`);
  const endTime = new Date(`1970-01-01T${end}`);
  const inputTime = new Date(`1970-01-01T${time}`);
  
  if (inputTime >= startTime && inputTime <= endTime) {
    return true;
  } else {
    return false;
  }
}

const FloorPlan = ({ triggerQuery, model, modelUpdate }) => {
  const container = useRef(null);

  console.log('model', model)
  token = model.token
  floorId = model.floorId

  function addCoffeeMarker(fpe, pos, value, id){
    const el = document.createElement('div')
    el.classList.add('coffee-machine')

    let iconClass
    if (value > 75){
      iconClass = 'green-100'
    } else if (value <=75 && value > 50) {
      iconClass = 'green-75'
    } else if (value <=50 && value > 25) {
      iconClass = 'yellow-50'
    } else {
      iconClass = 'red-25'
    }

    const container = document.createElement('div')
    const icon = document.createElement('div')
    const textCont = document.createElement('div')
    const text = document.createElement('span')

    container.classList.add('coffee-level-vis-cont')
    container.setAttribute('id', id)
    icon.classList.add('coffee-level-icon', iconClass)
    textCont.classList.add('coffee-level-text-cont')
    text.classList.add('text')

    text.textContent = value

    textCont.appendChild(text)
    container.appendChild(icon)
    container.appendChild(textCont)
    el.appendChild(container)

    const marker = fpe.addHtmlMarker({
      pos: pos,
      el
    })
    return marker
  }

  function updateCoffeeLevels(coffeeData){
    coffeeData.forEach(data => {
      const id = data.machineId
      const value = data.value
      
      let iconClass
      if (value > 75){
        iconClass = 'green-100'
      } else if (value <=75 && value > 50) {
        iconClass = 'green-75'
      } else if (value <=50 && value > 25) {
        iconClass = 'yellow-50'
      } else {
        iconClass = 'red-25'
      }

      const barCont = document.getElementById(id)
      const icon = barCont.querySelectorAll('div')[0]
      const textCont = barCont.querySelectorAll('div')[1]
      const text = textCont.querySelectorAll('span')[0]

      icon.removeAttribute('class')
      icon.classList.add('coffee-level-icon', iconClass)

      text.textContent = value
    })
  }

  function visualizeCoffeeMachine(assets){
    const coffeeMachines = assets.filter(asset => asset.productId === productId)
    coffeeMachines.forEach(machine => {
      const match = model.coffeeMachineData.find(data => data.machineId === machine.id)
      const coffeeLevel = match.value

      const position = [machine.position.x, machine.position.z]
      addCoffeeMarker(fpe, position, coffeeLevel,  machine.id)
    })
    prevCoffeeMachineData = model.coffeeMachineData
  }

  function selectMeetingRooms(resources){
    meetingRooms = resources.spaces.filter((space) => {
      return space.usage === 'meetingRoom';
    });
  }
  function createSpaceColorObjects(spaceResources) {
    spaceColorObjects = []

    meetingRooms = spaceResources.filter((space) => {
      return space.usage === 'meetingRoom';
    });

    if(model.meetingData && model.selectedTime){
      prevMeetingData = model.meetingData

      model.meetingData.forEach(meetingRoomData => {
        const match = meetingRooms.find(meetingRoom => meetingRoom.id === meetingRoomData.spaceId)
        const isOccupied = meetingRoomData.meetings.some(meeting => isTimeInRange(meeting.timeSlot, model.selectedTime))
        
        let color
        if(isOccupied){
          color = '#d5493a'//'#df9a9a'
        } else {
          color = '#279c45'//'#21ff00'
        }

        const rgb = hexToRgb(color) 

        const spaceColorObject = {
          space: match,
          displayData: { 
            color
          }
        }

        spaceColorObject.space.node.setHighlight({
          fill: rgb,
          fillOpacity: 0.4
        })
        
        spaceColorObjects.push(spaceColorObject)
      })
    }  
  }

  function onClick(fpe){
    fpe.on('click', (event) => {
      const position = event.pos
      const positionResources = fpe.getResourcesFromPosition(position)

      if(!positionResources.spaces.length){
        return
      }
      
      const selectedSpace = positionResources.spaces[0];

      if(selectedSpace.usage !== 'meetingRoom') {
        return
      }

      if (prevClickedMeetingRoomId && prevClickedMeetingRoomId == selectedSpace.id) return
      prevClickedMeetingRoomId = selectedSpace.id

      const match = spaceColorObjects.find(spaceColorObject => spaceColorObject.space.id === selectedSpace.id)
      
      modelUpdate({selectedRoomId: match.space.id})
    })
  }

  async function init(){
    fpe = new FloorPlanEngine({container: container.current, options: startupSettings})
    await fpe.loadScene(floorId, {publishableAccessToken: token})
    hasLoaded = floorId
  }
  
  useEffect(() => {
    if(!token || !floorId) return
    if(fpe && hasLoaded === floorId) return
    if(container.current){
      init()
      .then(() => {
        selectMeetingRooms(fpe.resources)
        createSpaceColorObjects(fpe.resources.spaces)
        visualizeCoffeeMachine(fpe.resources.assets)
        onClick(fpe)
      })
    }
  })

  useEffect(() => {
    if(!fpe || !hasLoaded) return
    if(hasLoaded !== model.floorId) return
    createSpaceColorObjects(fpe.resources.spaces)
  })

  useEffect(() => {
    if(!fpe || !hasLoaded) return
    if(hasLoaded !== model.floorId) return
    if(arrayEquals(prevCoffeeMachineData, model.coffeeMachineData)) return
    console.log('coffee data updating')
    updateCoffeeLevels(model.coffeeMachineData)
  })
  
  return(
    <div className='fpe' id="floor-plan" ref={container}></div>
  )
}

export default FloorPlan