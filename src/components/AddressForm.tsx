import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/TextField';
import type { Address } from '@/types/domain';

type Props = {
  value?: Address;
  onChange: (address: Address) => void;
};

const emptyAddress: Address = {
  receiverName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  detailAddress: '',
  note: '',
};

export function isValidAddress(address: Address) {
  return Boolean(
    address.receiverName.trim() &&
      address.phone.trim() &&
      address.province.trim() &&
      address.district.trim() &&
      address.ward.trim() &&
      address.detailAddress.trim(),
  );
}

export function AddressForm({ value, onChange }: Props) {
  const [address, setAddress] = useState<Address>(value ?? emptyAddress);

  const update = (patch: Partial<Address>) => {
    const next = { ...address, ...patch };
    setAddress(next);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <TextField label="Nguoi nhan" value={address.receiverName} onChangeText={(receiverName) => update({ receiverName })} />
      <TextField label="So dien thoai" value={address.phone} keyboardType="phone-pad" onChangeText={(phone) => update({ phone })} />
      <TextField label="Tinh / Thanh pho" value={address.province} onChangeText={(province) => update({ province })} />
      <TextField label="Quan / Huyen" value={address.district} onChangeText={(district) => update({ district })} />
      <TextField label="Phuong / Xa" value={address.ward} onChangeText={(ward) => update({ ward })} />
      <TextField label="Dia chi chi tiet" value={address.detailAddress} onChangeText={(detailAddress) => update({ detailAddress })} />
      <TextField label="Ghi chu" value={address.note} onChangeText={(note) => update({ note })} multiline />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
});
