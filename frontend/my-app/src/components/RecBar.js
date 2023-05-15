import React, { useState, useEffect } from 'react';

const RecBar = ({ camid, date }) => {

  async function fetchRecData() {
    console.log(date);
    const body = {camid:camid, year:date.year, month:date.month, day:date.day}
    const response = await fetch("/playback/rec/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    const json = await response.json();
    setrecData(json)
  }

  const [recData, setrecData] = useState([]);
  useEffect(() => {
    fetchRecData();
  }, []);

  const mybar = () => {
    const barStyle = {
      width: '100%',
      height: '20px',
      backgroundColor: '#ccc',
      position: 'relative',
    };


    const coloredRanges = [];

    // Iterate over each time range in the recData array
    recData.forEach((range) => {
      const { nStart, nEnd } = range;

      // Calculate the duration in seconds
      const durationSeconds = (nEnd - nStart) / 1000;

      // Calculate the width and left position of the colored range
      const width = (durationSeconds / 86400) * 100;
      const left = ((nStart % 86400) / 86400) * 100;

      // Create a colored range element with calculated styles
      const coloredRange = (
        <div
          key={`${nStart}-${nEnd}`}
          style={{
            backgroundColor: 'green',
            position: 'absolute',
            top: 0,
            height: '100%',
            width: `${width}%`,
            left: `${left}%`,
          }}
        />
      );

      // Add the colored range element to the array
      coloredRanges.push(coloredRange);
    });

    return (
      <div style={barStyle}>
        {coloredRanges}
      </div>
    );
  };

  return (
    <div>
      {mybar()}
    </div>
  );
};

export default RecBar;