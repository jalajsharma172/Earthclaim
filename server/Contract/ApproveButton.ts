import ethers from "ethers";

import CLAIM_EARTH_NFT_ABI from "./../abi.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ;
const [signer, setSigner] = useState<ethers.Signer | null>(null);


const contract = new ethers.Contract(CONTRACT_ADDRESS, CLAIM_EARTH_NFT_ABI, signer);
 