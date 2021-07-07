import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { QrEntry } from '../model/qr-entry';

import Encodr from "encodr";
import * as pako from 'pako';
import * as base45 from 'base45';
const cbor = new Encodr('cbor');

@Injectable({
  providedIn: 'root'
})
export class QrService {
  static QR_CODES = 'QR_CODES';

  constructor(private storage: Storage) { this.createStorage(); }

  async getAllQrCodes(): Promise<string[]> {
    let qrCodes = await this.storage.get(QrService.QR_CODES);
    return qrCodes ? qrCodes : [];
  }

  async addQrCode(qrCode: string): Promise<boolean> {
    let qrCodes = await this.getAllQrCodes();

    if (qrCodes.indexOf(qrCode) !== -1) {
      return false;
    }

    qrCodes.push(qrCode);
    await this.storage.set(QrService.QR_CODES, qrCodes);

    return true;
  }

  async deleteQrCode(qrCodeToDelete: string): Promise<boolean> {
    let qrCodes = await this.getAllQrCodes();

    if (qrCodes.indexOf(qrCodeToDelete) === -1) {
      return false;
    }

    qrCodes = qrCodes.filter(qrCode => qrCode !== qrCodeToDelete);
    await this.storage.set(QrService.QR_CODES, qrCodes);

    return true;
  }

  qrCodeToQrEntry(qrCode: string): QrEntry {
    return {
      qrCode,
      json: this.extractJsonPayload(qrCode)
    }
  }

  private async createStorage() {
    await this.storage.create();
  }

  private extractJsonPayload(prefixedQrCode: string): any {
    let base45String = prefixedQrCode.substring(4);
    let compressed = base45.decode(base45String);
    let extracted = Buffer.from(pako.inflate(compressed));

    let cose = cbor.decode(extracted);
    cose = cose.value[2].toString('hex');

    let payload: Map<any, any> = cbor.decode(cose);
    return payload.get(-260).get(1);
  }

}
