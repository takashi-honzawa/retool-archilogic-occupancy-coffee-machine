/*
  function getWindowsOnPerimeter(){
    const floorPolygons = getMergedSpace(fpe.scene)
    const floorOutline = floorPolygons.outline

    const perimeterWallRectangles = floorOutline.map((point, index) => {
      const nextPoint = floorOutline[index + 1] || floorOutline[0]
      return [
        [point[0], point[1]],
        [nextPoint[0], point[1]],
        [nextPoint[0], nextPoint[1]],
        [point[0], nextPoint[1]]
      ]
    })
  
    const allWindows = fpe.scene.nodesByType['window']
    const allWindowsWithWorldPosition = allWindows.map(node => node?.getWorldPosition())
    const windowOffset = 0.5
    windowsOnPerimeter = allWindowsWithWorldPosition.filter(node => {
      const polygon = [
        [
          [node.x - windowOffset, node.z - windowOffset],
          [node.x + windowOffset, node.z - windowOffset],
          [node.x + windowOffset, node.z + windowOffset],
          [node.x - windowOffset, node.z + windowOffset]
        ]
      ]
      const isWindowOnPerimeterWall = !perimeterWallRectangles.some(
        wall => polygonIntersection([wall], polygon).length
      )
      return isWindowOnPerimeterWall
    })
  }

  function windows(){
    windowsOnPerimeter.forEach(node => {
      addMarker(fpe, [node.x, node.z], true)
    })
  }
  */
  /*
  function getWindowGeometry(){
    const spaces = spaceApiData.features
    console.log(spaces)
    const spacesWithWindows = spaces.filter(space =>{
      return space.geometryOpenings.some(geometryOpening => {
        return geometryOpening.type == "window"
      })
    })
    
    console.log('spacesWithWindows', spacesWithWindows)

    const windowPolygons = spacesWithWindows.map((spaceWithWindows) => {
      const spacePolygon = spaceWithWindows.geometry.coordinates.map(coordinates => [...coordinates].reverse()); // bug? AL-1096
      
      return spaceWithWindows.geometryOpenings.map((geometryOpening) => {
        if (geometryOpening.type === "window") {
          const polygon = spacePolygon[geometryOpening.edgeIdx[0]];
          const edgeWithDoor = turf.lineString([
            polygon[geometryOpening.edgeIdx[1]],
            polygon[(geometryOpening.edgeIdx[1] + 1) % polygon.length]
          ]);
          const doorCoordinates = [
            turf.getCoord(
              turf.along(
                edgeWithDoor,
                // weird, this should be just geometryOpening.pos. Probably related to AL-1096
                (geometryOpening.pos - geometryOpening.l) /
                  METER_TO_KILOMETER,
                {
                  units: "kilometers"
                }
              )
            ),
            turf.getCoord(
              turf.along(
                edgeWithDoor,
                // weird, this should be geometryOpening.pos + geometryOpening.l. Probably related to AL-1096
                geometryOpening.pos / METER_TO_KILOMETER,
                { units: "kilometers" }
              )
            )
          ];
          // TODO: build a polygon for each door, using doorCoordinates
          return {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: doorCoordinates
            },
            properties: {}
          };
        }
        return null;
      });
    })
    .flat()
    .filter((doorPolygon) => doorPolygon !== null);
  }
  */