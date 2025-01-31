import React from 'react';
import styles from './page.module.css'; // ajuste o caminho conforme necessário

const SolarSystem = () => {
  return (
    <div className={styles['solar-system']}>
      <div className={styles.sun}></div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.mercury}`} style={{ backgroundColor: '#BEBEBE' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.venus}`} style={{ backgroundColor: '#FFD700' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.earth}`} style={{ backgroundColor: '#1E90FF' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.mars}`} style={{ backgroundColor: '#FF6347' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.jupiter}`} style={{ backgroundColor: '#FF7F50' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.saturn}`} style={{ backgroundColor: '#FFD700' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.uranus}`} style={{ backgroundColor: '#00FFFF' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.neptune}`} style={{ backgroundColor: '#4169E1' }}></div>
      </div>
      <div className={styles.orbit}>
        <div className={`${styles.planet} ${styles.pluto}`} style={{ backgroundColor: '#D2B48C' }}></div>
      </div>
    </div>
  );
}

export default SolarSystem;
