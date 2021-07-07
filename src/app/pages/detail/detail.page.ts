import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { QrEntry } from 'src/app/model/qr-entry';
import { QrService } from 'src/app/services/qr.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
})
export class DetailPage implements OnInit {

  @Input()
  qrEntry: QrEntry;

  constructor(
    private modalController: ModalController,
    private qrService: QrService,
    private toastController: ToastController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    if (!this.qrEntry) {
      await this.close();
    }
  }

  async close() {
    await this.modalController.dismiss();
  }

  async delete() {
    let success = false;
    let alert = await this.alertController.create({
      cssClass: 'alertCss',
      header: 'Achtung',
      message: 'QR Code unwiderruflich löschen?',
      buttons: [
        {
          text: 'Abbrechen'
        },
        {
          cssClass: 'dangerButton',
          text: 'Löschen',
          handler: async () => {
            success = await this.qrService.deleteQrCode(this.qrEntry.qrCode);
          }
        }
      ]
    });

    await alert.present();
    await alert.onDidDismiss();

    if (success) {
      let toast = await this.toastController.create({ duration: 3000 });
      await this.modalController.dismiss(success);
      toast.message = 'QR Code erfolgreich gelöscht!';
      await toast.present();
    }

  }

}
