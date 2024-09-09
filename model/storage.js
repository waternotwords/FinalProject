import { MMKV } from 'react-native-mmkv';


// stores a single instance of the MMKV to be used 
// by all PhysicalStorage all class instances
class PhysicalStorage {
  // instantiated on first use from class instance getter
  static STORAGE = null;

  get STORAGE(){
    if (PhysicalStorage.STORAGE == null) PhysicalStorage.STORAGE = new MMKV();
    return PhysicalStorage.STORAGE;
  };
}

export const Storage = ()=>(new PhysicalStorage());
