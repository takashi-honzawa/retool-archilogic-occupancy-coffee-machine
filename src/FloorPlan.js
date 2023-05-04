import React, { useEffect, useRef } from 'react';
import { FloorPlanEngine } from '@archilogic/floor-plan-sdk'
import './FloorPlan.css'

import {
  apiBaseURL,
  startupSettings,
  defaultColors,
  hexToRgb,
  generateGradients2Colors,
  generateGradients3Colors,
  map, 
  arrayEquals,
  objectEquals,
  createLine
} from './utils'

let prevOccupancyData
let prevMinMaxValues
let prevDateRange 

let spaceColorObjects = []

let midPoints = 10
let minColor = '#df9a9a'
let maxColor = '#21ff00'
let midColor = '#f1ff84'
const gradientColors = generateGradients3Colors(minColor, midColor, maxColor)

let outMin = 0
let outMax = midPoints - 1

let token
let floorId
let hasLoaded = false
let fpe
let layer
let colorScheme
let cursorMarker
let nearestMarkers = []
let bestWorstMarkers = []

let prevClickedMeetingRoomId

let meetingRooms

const minMaxObject = {
  collaborative: {min: {value: 10, desk: undefined}, max: {value: 0, desk: undefined}}, 
  quiet: {min: {value: 10, desk: undefined}, max: {value: 0, desk: undefined}}
}

const FloorPlan = ({ triggerQuery, model, modelUpdate }) => {
  const container = useRef(null);

  console.log('model', model)
  token = model.token
  floorId = model.floorId

  function addMarker(fpe, position, isCursorMarker, markerType = 'defalut-marker') {
    const el = document.createElement('div');
    el.className =  isCursorMarker ? "cursor-marker" : "icon-marker"
    el.classList.add(markerType)

    const marker = fpe.addHtmlMarker({
      el,
      pos: position,
      offset: [0, 0],
      radius: false,
    });
    return marker;
  }
  function removeCursorMarker(){
    if (cursorMarker){
      cursorMarker.remove();
      cursorMarker = undefined
    }
  }
  function removeNearestMarkers(){
    if (nearestMarkers.length !== 0){
      nearestMarkers.forEach(marker => marker.remove())
      nearestMarkers = [];
    }
  }
  function removeBestWorstMarkers(){
    if(bestWorstMarkers.length !== 0){
      bestWorstMarkers.forEach(marker => marker.remove())
      bestWorstMarkers = []
    }
  }

  function selectMeetingRooms(resources){
    meetingRooms = resources.spaces.filter((space) => {
      return space.usage === 'meetingRoom';
    });
  }
  function createSpaceColorObjects(spaceResources) {
    removeCursorMarker()
    removeNearestMarkers()
    
    if(model.colorScheme === "gradient"){
      createGradientColors(spaceResources)
      colorScheme = 'gradient'
    } else {
      createDefaultColors(spaceResources)
      colorScheme = 'default'
    }
  }
  function createDefaultColors(spaceResources){
    spaceColorObjects = []
    spaceResources.forEach(space => {
      if ( space.program ) {
        const color = defaultColors[space.program]
        const spaceColorObject = {
          space,
          displayData: { value: null, gradientIndex: null, color: color }
        }
        spaceColorObject.space.node.setHighlight({
          fill: color,
          fillOpacity: 0.4
        })
        spaceColorObjects.push(spaceColorObject)
      } else {
        const color = defaultColors['other']
        const spaceColorObject = {
          space,
          displayData: { value: null, gradientIndex: null, color: color }
        }
        spaceColorObject.space.node.setHighlight({
          fill: color,
          fillOpacity: 0.4
        })
        spaceColorObjects.push(spaceColorObject)
      }
    })
  }
  function createGradientColors(spaceResources){
    spaceColorObjects = []

    // prevOccupancyData = model.occupancyData
    // prevMinMaxValues = model.minMaxValues

    // const inMin = model.minMaxValues.min
    // const inMax = model.minMaxValues.min
    
    // spaceResources.forEach(space => {
    //   if(space.usage === 'meetingRoom'){
    //     const match = model.occupancyData.find(meetingRoomData => space.id === meetingRoomData.spaceId)
    //     console.log('!!!!!', match)
    //     const remappedFloat = map(match.meetingLengthSum, inMin, inMax, outMin, outMax)
    //     const remappedInt = Math.trunc(remappedFloat)
    //     const color = gradientColors[remappedInt]
    //     const rgb = hexToRgb(color) 
    //     const spaceColorObject = {
    //       space: space,
    //       displayData: { 
    //         value: match.meetingLengthSum,
    //         gradientIndex: remappedInt,
    //         color
    //       }
    //     }
    //     spaceColorObject.space.node.setHighlight({
    //       fill: rgb,
    //       fillOpacity: 0.4
    //     })
    //     spaceColorObjects.push(spaceColorObject)
    //   } else {
    //     const color = defaultColors['other']
    //     const spaceColorObject = {
    //       space,
    //       displayData: { value: null, gradientIndex: null, color: color }
    //     }
    //     spaceColorObject.space.node.setHighlight({
    //       fill: color,
    //       fillOpacity: 0.4
    //     })
    //     spaceColorObjects.push(spaceColorObject)
    //   }
    // })
    
    meetingRooms = spaceResources.filter((space) => {
      return space.usage === 'meetingRoom';
    });

    if(model.occupancyData && model.minMaxValues){
      prevOccupancyData = model.occupancyData
      prevMinMaxValues = model.minMaxValues
      prevDateRange = model.dateRange

      console.log('prevDateRange', prevDateRange)

      let inMin = model.minMaxValues.min
      let inMax = model.minMaxValues.min

      model.occupancyData.forEach(meetingRoomData => {
        const match = meetingRooms.find(meetingRoom => meetingRoom.id === meetingRoomData.spaceId)    
        const remappedFloat = map(meetingRoomData.meetingLengthSum, inMin, inMax, outMin, outMax)
        const remappedInt = Math.trunc(remappedFloat) ? Math.trunc(remappedFloat) : 0
        
        const color = gradientColors[remappedInt]
        const rgb = hexToRgb(color) 
        const spaceColorObject = {
          space: match,
          displayData: { 
            value: meetingRoomData.meetingLengthSum,
            gradientIndex: remappedInt,
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
      console.log('!!!!!')
      const position = event.pos
      const positionResources = fpe.getResourcesFromPosition(position)

      if(!positionResources.spaces.length){
        //removeCursorMarker()
        //removeNearestMarkers()
        return
      }
      
      const selectedSpace = positionResources.spaces[0];

      console.log(selectedSpace)

      if(selectedSpace.usage !== 'meetingRoom') {
        //removeCursorMarker()
        //removeNearestMarkers()
        return
      }

      if (prevClickedMeetingRoomId && prevClickedMeetingRoomId == selectedSpace.id) return
      prevClickedMeetingRoomId = selectedSpace.id

      const match = spaceColorObjects.find(spaceColorObject => spaceColorObject.space.id === selectedSpace.id)

      console.log('!!', match)
      
      //modelUpdate({selectedRoom: match})
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
        onClick(fpe)//!!!!
      })
    }
  })

  useEffect(() => {
    if(!fpe || !hasLoaded) return
    //onClick(fpe)
    if(arrayEquals(prevOccupancyData, model.occupancyData) || arrayEquals(prevMinMaxValues, model.minMaxValues)) return
    if(hasLoaded !== model.floorId) return
    if(prevDateRange !== model.dateRange){
      createSpaceColorObjects(fpe.resources.spaces)
    }
  })
  
  return(
    <div className='fpe' id="floor-plan" ref={container}></div>
  )
}

export default FloorPlan