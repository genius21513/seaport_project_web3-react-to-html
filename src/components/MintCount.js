import React,{ useState } from 'react';
import './MintCount.css';
const MintCount = () => {
    const [count, setCount] = useState(1);
    return (
        <div className='container'>
            <div className='minusBtn' onClick={()=>setCount(count-1>=1?count-1:1)}>-</div>
            <div className='mountText'>{count}</div>
            <div className='plusBtn' onClick={()=>setCount(count+1)}>+</div>
        </div>
    )
}

export default MintCount