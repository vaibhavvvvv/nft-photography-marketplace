import axios from 'axios';
import FormData from 'form-data';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface MetadataObject {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const uploadImageToPinata = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<PinataResponse>(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data;`,
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        },
      }
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading image to Pinata:', error);
    throw error;
  }
};

export const uploadMetadataToPinata = async (metadata: MetadataObject): Promise<string> => {
  try {
    const response = await axios.post<PinataResponse>(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
        },
      }
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw error;
  }
}; 