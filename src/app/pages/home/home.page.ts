import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { ModalController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { QrEntry } from 'src/app/model/qr-entry';
import { QrService } from 'src/app/services/qr.service';
import { DetailPage } from '../detail/detail.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  static THEME_KEY = 'THEME';
  static DARK_CSS_CLASS = 'dark'; // see variables.scss

  qrEntries: QrEntry[] = null; // null, so that 'no qr codes found' text is not displayed while loading qrcodes
  isCardView = true;

  constructor(
    private barcodeScanner: BarcodeScanner,
    private modalController: ModalController,
    private qrService: QrService,
    private toastController: ToastController,
    private storage: Storage
  ) { }

  async ionViewWillEnter() {
    await this.setTheme();
    let qrCodes = await this.qrService.getAllQrCodes();
    this.qrEntries = [];
    qrCodes.forEach(qrCode => this.qrEntries.push(this.qrService.qrCodeToQrEntry(qrCode)));
  }

  async toggleTheme() {
    document.body.classList.toggle(HomePage.DARK_CSS_CLASS);

    if (document.body.classList.contains(HomePage.DARK_CSS_CLASS)) {
      await this.storage.set(HomePage.THEME_KEY, HomePage.DARK_CSS_CLASS);
    } else {
      await this.storage.remove(HomePage.THEME_KEY);
    }
  }

  async setTheme() {
    // the theme is default dark, see index.html
    // this is because the eyes hurt when the user is in dark mode, leading to the screen shining white for a short moment.

    let theme = await this.storage.get(HomePage.THEME_KEY);
    if (theme !== HomePage.DARK_CSS_CLASS) {
      document.body.classList.toggle(HomePage.DARK_CSS_CLASS, false);
    }
  }

  async scan() {
    let scanResult = await this.barcodeScanner.scan();

    if (!scanResult.cancelled) {
      let toast = await this.toastController.create({ duration: 3000 });
      let success = await this.qrService.addQrCode(scanResult.text);

      if (success) {
        this.qrEntries.push(this.qrService.qrCodeToQrEntry(scanResult.text));
        toast.message = 'QR Code erfolgreich hinzugefügt!'
      } else {
        toast.message = 'QR Code existiert bereits';
      }

      await toast.present();
    }
  }

  async detail(qrEntry: QrEntry) {
    let modal = await this.modalController.create({
      component: DetailPage,
      componentProps: { qrEntry },
      swipeToClose: true
    });

    await modal.present();

    let wasDeleted = await modal.onDidDismiss();
    if (wasDeleted.data) {
      this.qrEntries = this.qrEntries.filter(e => e.qrCode !== qrEntry.qrCode);
    }
  }

  typeDisplay(json: any) {
    if ('v' in json) {
      return 'Impfung';
    } else if ('t' in json) {
      return 'Testung';
    } else if ('r' in json) {
      return 'Genesung';
    } else {
      return 'Unbekannter QR Typ'
    }
  }
}
