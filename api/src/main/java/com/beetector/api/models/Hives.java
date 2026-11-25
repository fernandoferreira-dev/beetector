package com.beetector.api.models;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Hives {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int hiveId;
    private String hiveClaimCode;
    private int paymentId;
    private int userId;
    private Integer apiaryId;
    private Integer gatewayId; // FIXME Change to Int when pallet stops sending null
    private String hiveName;
    private String hiveSerial;
    private String c6Id;
    private double hiveLat;
    private double hiveLon;
    private Integer batteryPercentage; // FIXME Change to Short when pallet stops sending null
    private Date hiveActivatedAt;
    private boolean favorite;
}
